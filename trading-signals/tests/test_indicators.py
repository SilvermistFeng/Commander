"""Tests for technical indicators.

These verify that our indicator calculations produce correct results.
We test against known values so we can trust the signals they generate.
"""

import pandas as pd
import pytest

from signals.indicators.moving_averages import ema, sma
from signals.indicators.momentum import macd, rsi


class TestSMA:
    def test_sma_basic(self):
        """SMA of [1,2,3,4,5] with window 3 should be [NaN, NaN, 2, 3, 4]."""
        prices = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])
        result = sma(prices, window=3)
        assert result.iloc[2] == pytest.approx(2.0)
        assert result.iloc[4] == pytest.approx(4.0)

    def test_sma_returns_series(self):
        prices = pd.Series([10.0, 20.0, 30.0, 40.0, 50.0])
        result = sma(prices, window=2)
        assert isinstance(result, pd.Series)


class TestRSI:
    def test_rsi_returns_bounded_values(self):
        """RSI should always be between 0 and 100."""
        prices = pd.Series(range(1, 30), dtype=float)
        result = rsi(prices, period=14)
        valid = result.dropna()
        assert (valid >= 0).all()
        assert (valid <= 100).all()
