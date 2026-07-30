"""The two examples from the spec, treated as golden (must-match) tests.

If the parser ever stops reproducing these exactly, something has regressed.
The reference date is fixed at 2026-07-30, matching the spec's <ref_date>.
"""

from datetime import date

from portfolio import parse

REF = date(2026, 7, 30)


def test_example_one_stock_buy():
    note = (
        "Bought 100 shares of NVDA at $125 yesterday in my Fidelity account "
        "with $2 fee"
    )
    result = parse(note, reference_date=REF)

    assert result.transaction.to_dict() == {
        "type": "BUY",
        "symbol": "NVDA",
        "asset_class": "STOCK",
        "date": "2026-07-29",
        "units": 100,
        "unit_price": 125,
        "fee": 2,
        "currency": "USD",
        "exchange_rate_to_base": 1,
        "account_id": "Fidelity",
        "tax_details": {"cost_basis_method": "FIFO"},
    }


def test_example_two_option_exercise():
    note = "Exercised 1 AAPL Call option $180 strike exp 2026-08-20 fee $1.50"
    result = parse(note, reference_date=REF)

    d = result.transaction.to_dict()

    assert d["type"] == "BUY"
    assert d["symbol"] == "AAPL"
    assert d["asset_class"] == "OPTION"
    # The expiry (2026-08-20) must NOT become the trade date.
    assert d["date"] == "2026-07-30"
    assert d["units"] == 1
    assert d["fee"] == 1.5
    assert d["option_details"] == {
        "type": "CALL",
        "strike": 180,
        "expiry": "2026-08-20",
    }
