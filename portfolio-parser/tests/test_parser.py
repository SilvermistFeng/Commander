"""Field-by-field parser tests across the asset classes and transaction types."""

from datetime import date

import pytest

from portfolio import parse
from portfolio.schema import AssetClass, OptionType, TransactionType

REF = date(2026, 7, 30)


def p(note: str):
    return parse(note, reference_date=REF).transaction


# -- transaction type detection --------------------------------------------


@pytest.mark.parametrize(
    "note, expected",
    [
        ("Bought 10 AAPL at $200", TransactionType.BUY),
        ("Sold 10 AAPL at $200", TransactionType.SELL),
        ("Received a dividend of $0.24 per share on 100 KO", TransactionType.DIVIDEND),
        ("2 for 1 stock split on TSLA", TransactionType.SPLIT),
        ("Deposited $5000 into my Schwab account", TransactionType.DEPOSIT),
        ("Withdrew $1000 from my account", TransactionType.WITHDRAWAL),
        ("Transferred 5 AAPL to my other account", TransactionType.TRANSFER),
    ],
)
def test_transaction_type(note, expected):
    assert p(note).type is expected


# -- asset class + symbol ---------------------------------------------------


def test_stock_symbol_via_of():
    tx = p("Bought 100 shares of NVDA at $125")
    assert tx.asset_class is AssetClass.STOCK
    assert tx.symbol == "NVDA"


def test_crypto_detected_from_known_ticker():
    tx = p("Bought 0.5 BTC at $60000 on Coinbase")
    assert tx.asset_class is AssetClass.CRYPTO
    assert tx.symbol == "BTC"
    assert tx.units == 0.5
    assert tx.unit_price == 60000
    assert tx.account_id == "Coinbase"


def test_forex_pair():
    tx = p("Bought 10000 EUR/USD at 1.08")
    assert tx.asset_class is AssetClass.FOREX
    assert tx.symbol == "EUR/USD"
    # Quote currency of the pair becomes the transaction currency.
    assert tx.currency == "USD"


def test_option_put_with_strike_and_expiry():
    tx = p("Sold 2 TSLA Put $200 strike expiring 2026-09-18")
    assert tx.asset_class is AssetClass.OPTION
    assert tx.type is TransactionType.SELL
    assert tx.option_details is not None
    assert tx.option_details.type is OptionType.PUT
    assert tx.option_details.strike == 200
    assert tx.option_details.expiry == date(2026, 9, 18)


def test_bond_details():
    tx = p("Bought a US Treasury bond, 4.5% coupon, semi-annual, maturing 2030-01-01")
    assert tx.asset_class is AssetClass.BOND
    assert tx.bond_details is not None
    assert tx.bond_details.coupon_rate == 4.5
    assert tx.bond_details.frequency.value == "SEMI-ANNUAL"
    assert tx.bond_details.maturity == date(2030, 1, 1)


# -- numeric fields ---------------------------------------------------------


def test_units_with_commas():
    tx = p("Bought 1,500 shares of AAPL at $190")
    assert tx.units == 1500


def test_fee_variants():
    assert p("Bought 10 AAPL at $100 with $3 fee").fee == 3
    assert p("Bought 10 AAPL at $100 commission $4.25").fee == 4.25


def test_price_each():
    assert p("Bought 10 AAPL for $150 each").unit_price == 150


# -- currency and fx --------------------------------------------------------


def test_currency_defaults_to_usd():
    assert p("Bought 10 AAPL at $100").currency == "USD"


def test_currency_from_symbol():
    assert p("Bought 10 shares of ASML at €600").currency == "EUR"


def test_currency_from_code():
    assert p("Bought 100 shares of DBS at 35 SGD").currency == "SGD"


def test_fx_rate():
    tx = p("Bought 100 shares of ASML at €600 fx rate 1.08")
    assert tx.exchange_rate_to_base == 1.08


# -- accounts ---------------------------------------------------------------


def test_account_my_x_account():
    assert p("Bought 10 AAPL at $100 in my Robinhood account").account_id == "Robinhood"


def test_account_defaults():
    assert p("Bought 10 AAPL at $100").account_id == "Default"


# -- tax details ------------------------------------------------------------


def test_cost_basis_defaults_fifo_on_buy():
    tx = p("Bought 10 AAPL at $100")
    assert tx.tax_details is not None
    assert tx.tax_details.cost_basis_method.value == "FIFO"


def test_cost_basis_lifo_override():
    tx = p("Sold 10 AAPL at $100 using LIFO")
    assert tx.tax_details.cost_basis_method.value == "LIFO"


def test_dividend_has_no_cost_basis():
    tx = p("Received dividend of $50 on AAPL")
    # Dividends don't move tax lots, so no cost-basis method is attached.
    assert tx.tax_details is None or tx.tax_details.cost_basis_method is None


# -- warnings ---------------------------------------------------------------


def test_unknown_ticker_is_flagged():
    result = parse("Bought 10 ZZZZ at $5", reference_date=REF)
    assert any("validation" in w for w in result.warnings)


def test_known_ticker_not_flagged():
    result = parse("Bought 10 AAPL at $100", reference_date=REF)
    assert not any("validation" in w for w in result.warnings)


# -- errors -----------------------------------------------------------------


def test_empty_input_raises():
    with pytest.raises(ValueError):
        parse("   ", reference_date=REF)
