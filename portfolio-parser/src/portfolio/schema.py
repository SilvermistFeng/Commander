"""The transaction schema — what a valid financial transaction looks like.

This is the single source of truth for the shape of the data. Everything
else in the package produces or validates one of these ``Transaction``
objects. Keeping the schema in one place means that if the rules change,
we change them here and nowhere else.

The design goal is simple: take a messy human sentence like
"Bought 100 NVDA at $125 yesterday" and turn it into a strict, predictable
JSON record that a dashboard, a tax report, or an accountant can rely on.

Nothing here talks to the internet, reads a file, or evaluates code. It is
pure data with a validation step — safe to run anywhere.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date
from enum import Enum

# ---------------------------------------------------------------------------
# Controlled vocabularies
#
# These are the *only* allowed values for their fields. Using an Enum means a
# typo like "BYU" or "STONK" is caught immediately instead of silently
# poisoning the data downstream.
# ---------------------------------------------------------------------------


class TransactionType(str, Enum):
    """What kind of event this transaction records."""

    BUY = "BUY"
    SELL = "SELL"
    DIVIDEND = "DIVIDEND"
    SPLIT = "SPLIT"
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    TRANSFER = "TRANSFER"


class AssetClass(str, Enum):
    """The category of thing being traded."""

    STOCK = "STOCK"
    CRYPTO = "CRYPTO"
    OPTION = "OPTION"
    BOND = "BOND"
    FOREX = "FOREX"


class OptionType(str, Enum):
    """A call gives the right to buy; a put gives the right to sell."""

    CALL = "CALL"
    PUT = "PUT"


class CouponFrequency(str, Enum):
    """How often a bond pays interest."""

    ANNUAL = "ANNUAL"
    SEMI_ANNUAL = "SEMI-ANNUAL"


class CostBasisMethod(str, Enum):
    """How gains are calculated for tax when you sell part of a holding.

    FIFO = first shares bought are the first sold.
    LIFO = last shares bought are the first sold.
    AVG  = every share is treated as the average purchase price.
    """

    FIFO = "FIFO"
    LIFO = "LIFO"
    AVG = "AVG"


class SchemaError(ValueError):
    """Raised when a transaction cannot satisfy the schema rules."""


# ---------------------------------------------------------------------------
# Nested detail blocks
#
# These only appear when they are relevant. An option trade carries
# ``option_details``; a bond carries ``bond_details``. A plain stock trade
# carries neither.
# ---------------------------------------------------------------------------


@dataclass
class OptionDetails:
    """Extra fields that only make sense for an option contract."""

    type: OptionType
    strike: float
    expiry: date

    def to_dict(self) -> dict:
        return {
            "type": self.type.value,
            "strike": _clean_number(self.strike),
            "expiry": self.expiry.isoformat(),
        }


@dataclass
class BondDetails:
    """Extra fields that only make sense for a bond."""

    coupon_rate: float
    maturity: date
    frequency: CouponFrequency

    def to_dict(self) -> dict:
        return {
            "coupon_rate": _clean_number(self.coupon_rate),
            "maturity": self.maturity.isoformat(),
            "frequency": self.frequency.value,
        }


@dataclass
class TaxDetails:
    """Tax-relevant information. Fields are optional and only emitted when set."""

    withheld_tax: float | None = None
    cost_basis_method: CostBasisMethod | None = None

    def is_empty(self) -> bool:
        return self.withheld_tax is None and self.cost_basis_method is None

    def to_dict(self) -> dict:
        out: dict = {}
        if self.withheld_tax is not None:
            out["withheld_tax"] = _clean_number(self.withheld_tax)
        if self.cost_basis_method is not None:
            out["cost_basis_method"] = self.cost_basis_method.value
        return out


# ---------------------------------------------------------------------------
# The transaction itself
# ---------------------------------------------------------------------------


@dataclass
class Transaction:
    """A single, fully-formed financial transaction.

    The scalar fields (type, symbol, amounts, currency…) are always present.
    The nested detail blocks appear only when the asset class calls for them.
    """

    type: TransactionType
    symbol: str
    asset_class: AssetClass
    date: date
    units: float = 0.0
    unit_price: float = 0.0
    fee: float = 0.0
    currency: str = "USD"
    exchange_rate_to_base: float = 1.0
    account_id: str = "Default"
    option_details: OptionDetails | None = None
    bond_details: BondDetails | None = None
    tax_details: TaxDetails | None = None

    # -- validation ---------------------------------------------------------

    def validate(self) -> None:
        """Check the transaction obeys the schema rules.

        Raises ``SchemaError`` with a plain-English message on the first
        problem found. Callers that want to know *everything* wrong at once
        can use :meth:`errors` instead.
        """
        problems = self.errors()
        if problems:
            raise SchemaError("; ".join(problems))

    def errors(self) -> list[str]:
        """Return a list of every schema violation (empty list = valid)."""
        problems: list[str] = []

        if not self.symbol or not self.symbol.strip():
            problems.append("symbol is required and cannot be empty")

        if self.units < 0:
            problems.append("units cannot be negative")
        if self.unit_price < 0:
            problems.append("unit_price cannot be negative")
        if self.fee < 0:
            problems.append("fee cannot be negative")
        if self.exchange_rate_to_base <= 0:
            problems.append("exchange_rate_to_base must be greater than zero")

        if len(self.currency) != 3 or not self.currency.isalpha():
            problems.append(
                f"currency must be a 3-letter code, got {self.currency!r}"
            )

        # An option trade needs option details; a non-option must not carry them.
        if self.asset_class is AssetClass.OPTION and self.option_details is None:
            problems.append("OPTION asset_class requires option_details")
        if self.asset_class is not AssetClass.OPTION and self.option_details:
            problems.append("option_details only valid for OPTION asset_class")

        # Same logic for bonds.
        if self.asset_class is AssetClass.BOND and self.bond_details is None:
            problems.append("BOND asset_class requires bond_details")
        if self.asset_class is not AssetClass.BOND and self.bond_details:
            problems.append("bond_details only valid for BOND asset_class")

        return problems

    # -- serialisation ------------------------------------------------------

    def to_dict(self) -> dict:
        """Render to a plain dict, ready for JSON.

        Optional nested blocks are omitted entirely when they are empty, so
        a simple stock buy stays clean and free of null clutter.
        """
        out: dict = {
            "type": self.type.value,
            "symbol": self.symbol,
            "asset_class": self.asset_class.value,
            "date": self.date.isoformat(),
            "units": _clean_number(self.units),
            "unit_price": _clean_number(self.unit_price),
            "fee": _clean_number(self.fee),
            "currency": self.currency,
            "exchange_rate_to_base": _clean_number(self.exchange_rate_to_base),
            "account_id": self.account_id,
        }
        if self.option_details is not None:
            out["option_details"] = self.option_details.to_dict()
        if self.bond_details is not None:
            out["bond_details"] = self.bond_details.to_dict()
        if self.tax_details is not None and not self.tax_details.is_empty():
            out["tax_details"] = self.tax_details.to_dict()
        return out

    def to_json(self, *, indent: int | None = None) -> str:
        """Render to a JSON string. Validates first — invalid data never ships."""
        self.validate()
        return json.dumps(self.to_dict(), indent=indent)


def _clean_number(value: float) -> float | int:
    """Present whole numbers as ints (100, not 100.0) for tidy JSON output.

    ``125.0`` and ``125`` are both valid JSON, but human-entered trade data
    reads better without the dangling ``.0``. Genuine fractions are preserved.
    """
    if isinstance(value, bool):  # guard: bools are a subclass of int
        return value
    if float(value).is_integer():
        return int(value)
    return round(float(value), 10)
