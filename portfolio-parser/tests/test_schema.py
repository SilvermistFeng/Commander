"""Tests for the schema itself — validation rules and JSON serialisation."""

import json
from datetime import date

import pytest

from portfolio.schema import (
    AssetClass,
    OptionDetails,
    OptionType,
    SchemaError,
    Transaction,
    TransactionType,
)


def _stock() -> Transaction:
    return Transaction(
        type=TransactionType.BUY,
        symbol="AAPL",
        asset_class=AssetClass.STOCK,
        date=date(2026, 7, 30),
        units=10,
        unit_price=200,
    )


def test_valid_transaction_passes():
    _stock().validate()  # should not raise


def test_negative_units_rejected():
    tx = _stock()
    tx.units = -1
    with pytest.raises(SchemaError):
        tx.validate()


def test_bad_currency_rejected():
    tx = _stock()
    tx.currency = "DOLLARS"
    assert any("currency" in e for e in tx.errors())


def test_option_requires_details():
    tx = _stock()
    tx.asset_class = AssetClass.OPTION
    assert any("option_details" in e for e in tx.errors())


def test_option_details_on_non_option_rejected():
    tx = _stock()
    tx.option_details = OptionDetails(OptionType.CALL, 100, date(2026, 8, 1))
    assert any("option_details only valid" in e for e in tx.errors())


def test_whole_numbers_serialise_without_trailing_zero():
    payload = json.loads(_stock().to_json())
    assert payload["units"] == 10
    assert payload["unit_price"] == 200
    # No dangling ".0" in the raw JSON text either.
    assert "10.0" not in _stock().to_json()


def test_fractional_numbers_preserved():
    tx = _stock()
    tx.units = 0.5
    assert json.loads(tx.to_json())["units"] == 0.5


def test_to_json_validates_first():
    tx = _stock()
    tx.symbol = ""
    with pytest.raises(SchemaError):
        tx.to_json()


def test_optional_blocks_omitted_when_empty():
    payload = json.loads(_stock().to_json())
    assert "option_details" not in payload
    assert "bond_details" not in payload
