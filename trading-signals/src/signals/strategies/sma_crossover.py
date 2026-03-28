"""SMA Crossover Strategy — our first strategy.

The simplest trend-following strategy. It uses two moving averages:
- A short one (e.g. 20 days) that reacts quickly
- A long one (e.g. 50 days) that shows the bigger trend

When the short crosses ABOVE the long → Buy signal
  (recent momentum is stronger than the longer trend)

When the short crosses BELOW the long → Sell signal
  (recent momentum is weakening)

This is deliberately simple. It won't beat the market every year,
but it teaches the fundamentals of signal generation and testing.
"""

import pandas as pd

from signals.config import Config
from signals.indicators.moving_averages import sma
from signals.strategies.base import Strategy


class SmaCrossover(Strategy):
    """Simple Moving Average Crossover strategy."""

    def __init__(self, config: Config | None = None):
        self._config = config or Config()

    @property
    def name(self) -> str:
        short = self._config.sma_short_window
        long = self._config.sma_long_window
        return f"SMA Crossover ({short}/{long})"

    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """Generate buy/sell signals based on SMA crossover."""
        close = data["Close"]

        short_sma = sma(close, self._config.sma_short_window)
        long_sma = sma(close, self._config.sma_long_window)

        signals = pd.Series(0, index=data.index)

        # Buy when short SMA crosses above long SMA
        signals[short_sma > long_sma] = 1
        # Sell when short SMA crosses below long SMA
        signals[short_sma <= long_sma] = -1

        # Only keep the crossover points (changes), not hold signals
        signals = signals.diff().fillna(0)
        signals = signals.map({2.0: 1, -2.0: -1}).fillna(0).astype(int)

        return signals
