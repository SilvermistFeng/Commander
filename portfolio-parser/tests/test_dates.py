"""Tests for date resolution — the part most likely to bite silently."""

from datetime import date

import pytest

from portfolio.dates import find_expiry, parse_date

REF = date(2026, 7, 30)  # a Thursday


@pytest.mark.parametrize(
    "text, expected",
    [
        ("bought today", date(2026, 7, 30)),
        ("bought yesterday", date(2026, 7, 29)),
        ("day before yesterday", date(2026, 7, 28)),
        ("3 days ago", date(2026, 7, 27)),
        ("2 weeks ago", date(2026, 7, 16)),
        ("on 2026-01-15", date(2026, 1, 15)),
        ("on Aug 20 2026", date(2026, 8, 20)),
        ("on August 5", date(2026, 8, 5)),
    ],
)
def test_parse_date(text, expected):
    assert parse_date(text, REF) == expected


def test_last_weekday():
    # 2026-07-30 is a Thursday; "last Friday" is the previous Friday, 2026-07-24.
    assert parse_date("last Friday", REF) == date(2026, 7, 24)


def test_missing_date_defaults_to_reference():
    assert parse_date("Bought 10 AAPL at $100", REF) == REF


def test_find_expiry_returns_none_when_absent():
    assert find_expiry("no date here", REF) is None


def test_find_expiry_iso():
    assert find_expiry("exp 2026-08-20", REF) == date(2026, 8, 20)
