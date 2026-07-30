"""portfolio-parser — natural language financial transactions into validated JSON.

Public API::

    from portfolio import parse

    result = parse("Bought 100 shares of NVDA at $125 yesterday with $2 fee")
    print(result.to_json())        # strict schema JSON
    print(result.warnings)         # advisory notes (e.g. unknown ticker)

Everything is pure-Python and offline. See :mod:`portfolio.schema` for the
data shape and :mod:`portfolio.parser` for the extraction logic.
"""

from portfolio.parser import ParseResult, parse
from portfolio.schema import (
    AssetClass,
    BondDetails,
    CostBasisMethod,
    CouponFrequency,
    OptionDetails,
    OptionType,
    SchemaError,
    TaxDetails,
    Transaction,
    TransactionType,
)

__all__ = [
    "parse",
    "ParseResult",
    "Transaction",
    "TransactionType",
    "AssetClass",
    "OptionType",
    "OptionDetails",
    "BondDetails",
    "CouponFrequency",
    "TaxDetails",
    "CostBasisMethod",
    "SchemaError",
]

__version__ = "0.1.0"
