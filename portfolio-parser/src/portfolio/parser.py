"""The natural-language parser — sentence in, structured transaction out.

This reads a human-written trade note such as::

    Bought 100 shares of NVDA at $125 yesterday in my Fidelity account with $2 fee

and produces a validated :class:`~portfolio.schema.Transaction`.

**How it works, and why this way.** Rather than one giant regular expression
(unreadable and impossible to debug), each field has its own small, focused
extractor. If the "fee" logic is wrong, you fix the fee extractor and nothing
else. Each extractor is easy to read, easy to test, and easy to extend.

**What it deliberately does NOT do.** It never calls an API, never touches the
network, never evaluates any of the input as code. Unknown ticker symbols are
*flagged* for later validation, not looked up here. That keeps parsing fast,
deterministic, offline, and safe against hostile input.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date

from portfolio.dates import find_expiry, parse_date
from portfolio.schema import (
    AssetClass,
    BondDetails,
    CostBasisMethod,
    CouponFrequency,
    OptionDetails,
    OptionType,
    TaxDetails,
    Transaction,
    TransactionType,
)

# ---------------------------------------------------------------------------
# Small reference tables
# ---------------------------------------------------------------------------

# 3-letter currency codes we recognise. Used both to detect the trade currency
# and to stop a currency code being mistaken for a stock ticker.
CURRENCY_CODES = {
    "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD",
    "SGD", "HKD", "CNY", "CNH", "INR", "KRW", "SEK", "NOK",
}

# Currency symbols → code.
CURRENCY_SYMBOLS = {"€": "EUR", "£": "GBP", "¥": "JPY", "$": "USD"}

# A small starter list of crypto tickers. Anything here is treated as CRYPTO.
KNOWN_CRYPTO = {
    "BTC", "ETH", "SOL", "ADA", "DOGE", "XRP", "DOT", "MATIC",
    "LTC", "BCH", "LINK", "AVAX", "UNI", "ATOM", "USDT", "USDC",
}

# A small starter list of well-known stock/ETF tickers. A symbol NOT on this
# list is still parsed, but gets flagged for API validation — exactly as the
# spec asks. In production this set would come from a live security master.
KNOWN_STOCKS = {
    "AAPL", "NVDA", "MSFT", "GOOGL", "GOOG", "AMZN", "TSLA", "META",
    "NFLX", "AMD", "INTC", "SPY", "QQQ", "VOO", "VTI", "KO", "PEP",
    "JPM", "BAC", "DIS", "BABA", "ASML", "TSM", "BRK", "V", "MA",
}

# Uppercase tokens that look like tickers but are really keywords.
_RESERVED_TOKENS = (
    CURRENCY_CODES
    | {
        "BUY", "SELL", "CALL", "PUT", "OPTION", "BOND", "STOCK", "CRYPTO",
        "FOREX", "FIFO", "LIFO", "AVG", "ANNUAL", "SEMI", "DEPOSIT",
        "WITHDRAWAL", "TRANSFER", "DIVIDEND", "SPLIT", "FEE", "DCA", "PNL",
        "EXP", "EACH", "AT", "OF", "IN", "MY", "WITH", "AND", "THE", "ETF",
    }
)

# Verb → transaction type. Checked in this order, so the more specific
# money-movement verbs win before the generic buy/sell verbs.
_TYPE_KEYWORDS: list[tuple[TransactionType, tuple[str, ...]]] = [
    (TransactionType.DIVIDEND, ("dividend", "div ", "coupon payment")),
    (TransactionType.SPLIT, ("split", "stock split")),
    (TransactionType.DEPOSIT, ("deposit", "funded", "contributed", "added cash")),
    (TransactionType.WITHDRAWAL, ("withdrew", "withdrawal", "withdraw", "took out")),
    (TransactionType.TRANSFER, ("transfer", "moved", "sent")),
    (TransactionType.SELL, ("sold", "sell", "wrote", "disposed", "exited")),
    (TransactionType.BUY, ("bought", "buy", "purchased", "acquired",
                           "exercised", "assigned", "reinvested")),
]

_NUM = r"(\d+(?:,\d{3})*(?:\.\d+)?)"  # 1,000.50 style numbers


@dataclass
class ParseResult:
    """The outcome of parsing: the transaction plus any advisory warnings.

    Warnings never block parsing. They surface soft concerns — an unknown
    ticker, a missing price — that a human or a downstream API should review.
    """

    transaction: Transaction
    warnings: list[str] = field(default_factory=list)

    def to_json(self, *, indent: int | None = None) -> str:
        """The strict schema JSON for the transaction (warnings excluded)."""
        return self.transaction.to_json(indent=indent)


def parse(text: str, reference_date: date | None = None) -> ParseResult:
    """Parse a natural-language trade note into a validated transaction.

    Args:
        text: The human-written note, e.g. "Sold 50 TSLA at $250 today".
        reference_date: The date that "today"/"yesterday" resolve against.
            Defaults to the real current date. Pass a fixed value for
            reproducible results (tests do exactly this).

    Returns:
        A :class:`ParseResult`. Access ``.transaction`` for the record,
        ``.warnings`` for advisory notes, or ``.to_json()`` for the JSON.

    Raises:
        portfolio.schema.SchemaError: if the finished transaction cannot
            satisfy the schema (validated before return).
    """
    if reference_date is None:
        reference_date = date.today()

    if not text or not text.strip():
        raise ValueError("cannot parse an empty transaction note")

    warnings: list[str] = []
    lowered = text.lower()

    tx_type = _detect_type(lowered, warnings)
    asset_class, symbol = _detect_asset_and_symbol(text, lowered, warnings)

    # Transaction date. We strip any option/bond expiry clause first so that,
    # e.g., "exp 2026-08-20" is not mistaken for the date of the trade itself.
    tx_date = parse_date(_strip_expiry_clauses(text), reference_date)

    tx = Transaction(
        type=tx_type,
        symbol=symbol,
        asset_class=asset_class,
        date=tx_date,
        units=_extract_units(lowered, symbol),
        unit_price=_extract_price(lowered),
        fee=_extract_fee(lowered),
        currency=_extract_currency(text, asset_class, symbol),
        exchange_rate_to_base=_extract_fx_rate(lowered),
        account_id=_extract_account(text),
    )

    if asset_class is AssetClass.OPTION:
        tx.option_details = _extract_option_details(text, lowered, reference_date,
                                                    warnings)
    if asset_class is AssetClass.BOND:
        tx.bond_details = _extract_bond_details(text, lowered, reference_date)

    tx.tax_details = _extract_tax_details(lowered, tx_type)

    _flag_unknown_symbol(symbol, asset_class, warnings)

    tx.validate()
    return ParseResult(transaction=tx, warnings=warnings)


# ---------------------------------------------------------------------------
# Field extractors — one small function per field
# ---------------------------------------------------------------------------


def _detect_type(lowered: str, warnings: list[str]) -> TransactionType:
    for tx_type, keywords in _TYPE_KEYWORDS:
        if any(kw in lowered for kw in keywords):
            return tx_type
    warnings.append("no transaction verb recognised; defaulting to BUY")
    return TransactionType.BUY


def _detect_asset_and_symbol(
    text: str, lowered: str, warnings: list[str]
) -> tuple[AssetClass, str]:
    """Work out the asset class and ticker together — they inform each other."""

    # 1. Forex: a currency pair like EUR/USD.
    pair = re.search(r"\b([A-Z]{3})/([A-Z]{3})\b", text)
    if pair and pair.group(1) in CURRENCY_CODES and pair.group(2) in CURRENCY_CODES:
        return AssetClass.FOREX, f"{pair.group(1)}/{pair.group(2)}"

    # 2. Option: mentions a call or a put.
    if re.search(r"\b(call|put)\b", lowered):
        m = re.search(r"\b([A-Za-z]{1,5})\s+(?:call|put)\b", text, re.IGNORECASE)
        symbol = m.group(1).upper() if m else _first_ticker(text)
        return AssetClass.OPTION, symbol or "UNKNOWN"

    # 3. Bond.
    if re.search(r"\b(bond|coupon|maturit(?:y|ies)|matures|treasury)\b", lowered):
        return AssetClass.BOND, _first_ticker(text) or "BOND"

    # 4. Crypto: a recognised coin ticker, or the word crypto/coin.
    for token in _ticker_candidates(text):
        if token in KNOWN_CRYPTO:
            return AssetClass.CRYPTO, token
    if re.search(r"\b(crypto|coin|token)\b", lowered):
        return AssetClass.CRYPTO, _first_ticker(text) or "UNKNOWN"

    # 5. Cash movements with no security attached: use the currency as symbol.
    if any(w in lowered for w in ("deposit", "withdraw", "withdrew", "funded")):
        if not _first_ticker(text):
            cur = _extract_currency(text, AssetClass.STOCK, "")
            return AssetClass.FOREX, cur

    # 6. Default: a stock/ETF.
    symbol = _first_ticker(text)
    if not symbol:
        warnings.append("no ticker symbol found")
        symbol = "UNKNOWN"
    return AssetClass.STOCK, symbol


def _ticker_candidates(text: str) -> list[str]:
    """All-caps 1-5 letter tokens that could be a ticker, minus known keywords."""
    return [
        tok
        for tok in re.findall(r"\b[A-Z]{1,5}\b", text)
        if tok not in _RESERVED_TOKENS
    ]


def _first_ticker(text: str) -> str | None:
    # Prefer a symbol introduced by "of" ("shares of NVDA"), else the first
    # plausible all-caps token.
    m = re.search(r"\bof\s+([A-Z]{1,5})\b", text)
    if m and m.group(1) not in _RESERVED_TOKENS:
        return m.group(1)
    candidates = _ticker_candidates(text)
    return candidates[0] if candidates else None


def _extract_units(lowered: str, symbol: str) -> float:
    # Explicit quantity words first.
    for unit_word in (r"shares?", r"units?", r"contracts?", r"coins?", r"tokens?"):
        m = re.search(_NUM + r"\s+" + unit_word + r"\b", lowered)
        if m:
            return _to_float(m.group(1))

    # A number sitting right before the symbol: "0.5 BTC", "1 AAPL".
    if symbol and symbol not in ("UNKNOWN", "BOND"):
        base = symbol.split("/")[0]
        m = re.search(_NUM + r"\s+" + re.escape(base.lower()) + r"\b", lowered)
        if m:
            return _to_float(m.group(1))

    # A number straight after the action verb: "bought 100 ...".
    m = re.search(
        r"\b(?:bought|buy|sold|sell|purchased|acquired|exercised|wrote|"
        r"deposited?|withdrew|withdraw|transferred|reinvested)\s+\$?" + _NUM,
        lowered,
    )
    if m:
        return _to_float(m.group(1))

    return 0.0


def _extract_price(lowered: str) -> float:
    patterns = (
        r"(?:at|@|for)\s*\$?\s*" + _NUM + r"\s*(?:each|per\s+(?:share|unit|coin))?",
        r"price\s*(?:of|:)?\s*\$?\s*" + _NUM,
        r"\$?\s*" + _NUM + r"\s*per\s+(?:share|unit|coin)",
    )
    for pattern in patterns:
        m = re.search(pattern, lowered)
        if m:
            return _to_float(m.group(1))
    return 0.0


def _extract_fee(lowered: str) -> float:
    patterns = (
        r"(?:fee|commission|comm)\s*(?:of|:)?\s*\$?\s*" + _NUM,
        r"\$?\s*" + _NUM + r"\s*(?:fee|commission)",
    )
    for pattern in patterns:
        m = re.search(pattern, lowered)
        if m:
            return _to_float(m.group(1))
    return 0.0


def _extract_currency(text: str, asset_class: AssetClass, symbol: str) -> str:
    # For a forex pair the traded currency is the quote (second) currency.
    if asset_class is AssetClass.FOREX and "/" in symbol:
        return symbol.split("/")[1]

    for sym, code in CURRENCY_SYMBOLS.items():
        if sym != "$" and sym in text:  # $ is the USD default; ignore it here
            return code

    for token in re.findall(r"\b[A-Z]{3}\b", text):
        if token in CURRENCY_CODES:
            return token

    return "USD"


def _extract_fx_rate(lowered: str) -> float:
    m = re.search(r"(?:exchange rate|fx rate|fx)\s*(?:of|:)?\s*" + _NUM, lowered)
    if m:
        return _to_float(m.group(1))
    return 1.0


def _extract_account(text: str) -> str:
    patterns = (
        r"in\s+my\s+([A-Za-z0-9&'\- ]+?)\s+account",
        r"in\s+(?:my\s+)?([A-Z][A-Za-z0-9]+)\s+account",
        r"account\s*(?:id|:|#)?\s*([A-Za-z0-9\-]+)",
        r"(?:in|at|on|via|through)\s+(?:my\s+)?"
        r"(Fidelity|Robinhood|Schwab|Vanguard|E\*?Trade|Etrade|IBKR|"
        r"Interactive Brokers|Coinbase|Binance|Kraken|Webull)\b",
    )
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return "Default"


def _extract_option_details(
    text: str, lowered: str, reference: date, warnings: list[str]
) -> OptionDetails:
    opt_type = OptionType.PUT if re.search(r"\bput\b", lowered) else OptionType.CALL

    strike = 0.0
    for pattern in (
        r"(?:strike\s*(?:price)?)\s*(?:of|:|at)?\s*\$?\s*" + _NUM,
        r"\$?\s*" + _NUM + r"\s*strike",
    ):
        m = re.search(pattern, lowered)
        if m:
            strike = _to_float(m.group(1))
            break

    expiry = find_expiry(_expiry_clause(text) or text, reference)
    if expiry is None:
        warnings.append("option has no explicit expiry; using reference date")
        expiry = reference

    return OptionDetails(type=opt_type, strike=strike, expiry=expiry)


def _extract_bond_details(text: str, lowered: str, reference: date) -> BondDetails:
    coupon = 0.0
    for pattern in (
        r"" + _NUM + r"\s*%\s*coupon",
        r"coupon\s*(?:rate)?\s*(?:of|:)?\s*" + _NUM + r"\s*%?",
    ):
        m = re.search(pattern, lowered)
        if m:
            coupon = _to_float(m.group(1))
            break

    frequency = (
        CouponFrequency.SEMI_ANNUAL
        if re.search(r"semi[\s-]?annual", lowered)
        else CouponFrequency.ANNUAL
    )

    maturity = find_expiry(_maturity_clause(text) or text, reference) or reference
    return BondDetails(coupon_rate=coupon, maturity=maturity, frequency=frequency)


def _extract_tax_details(lowered: str, tx_type: TransactionType) -> TaxDetails | None:
    details = TaxDetails()

    # Cost basis method applies when tax lots move: buys and sells.
    if tx_type in (TransactionType.BUY, TransactionType.SELL):
        if re.search(r"\blifo\b", lowered):
            details.cost_basis_method = CostBasisMethod.LIFO
        elif re.search(r"\b(avg|average(?:\s+cost)?)\b", lowered):
            details.cost_basis_method = CostBasisMethod.AVG
        else:
            details.cost_basis_method = CostBasisMethod.FIFO

    # Withheld tax typically shows up on dividends.
    m = re.search(
        r"(?:withheld|withholding)\s*(?:tax)?\s*(?:of)?\s*\$?\s*" + _NUM, lowered
    ) or re.search(_NUM + r"\s*(?:tax\s*)?withheld", lowered)
    if m:
        details.withheld_tax = _to_float(m.group(1))

    return None if details.is_empty() else details


def _flag_unknown_symbol(
    symbol: str, asset_class: AssetClass, warnings: list[str]
) -> None:
    if asset_class in (AssetClass.STOCK, AssetClass.OPTION):
        base = symbol.split("/")[0]
        if base not in KNOWN_STOCKS and base not in ("UNKNOWN", "BOND"):
            warnings.append(
                f"ticker {base!r} is not in the known list — "
                f"flag for API validation check"
            )


# ---------------------------------------------------------------------------
# Helpers for isolating expiry/maturity clauses
# ---------------------------------------------------------------------------

_EXP_KEYWORD = r"exp(?:iry|ires|iring|\.)?|expiration"
_MAT_KEYWORD = r"maturity|matures|maturing|maturing on"
_DATE_TAIL = (
    r"(?:on\s+)?(?:\d{4}-\d{2}-\d{2}|"
    r"[A-Za-z]{3,9}\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)"
)


def _expiry_clause(text: str) -> str | None:
    m = re.search(r"(?:" + _EXP_KEYWORD + r")\s*" + _DATE_TAIL, text, re.IGNORECASE)
    return m.group(0) if m else None


def _maturity_clause(text: str) -> str | None:
    m = re.search(r"(?:" + _MAT_KEYWORD + r")\s*" + _DATE_TAIL, text, re.IGNORECASE)
    return m.group(0) if m else None


def _strip_expiry_clauses(text: str) -> str:
    """Remove expiry/maturity clauses so they don't pollute the trade date."""
    cleaned = re.sub(
        r"(?:" + _EXP_KEYWORD + r"|" + _MAT_KEYWORD + r")\s*" + _DATE_TAIL,
        " ",
        text,
        flags=re.IGNORECASE,
    )
    return cleaned


def _to_float(raw: str) -> float:
    """Turn a captured number string (possibly with thousands commas) into a float."""
    return float(raw.replace(",", ""))
