"""Moving average indicators — SMA and EMA.

Moving averages smooth out price data to show the overall trend.
Think of it like looking at a river from a hilltop instead of
standing in it — you see the direction, not every ripple.

- SMA (Simple Moving Average): Average of the last N days
- EMA (Exponential Moving Average): Like SMA but gives more
  weight to recent prices (reacts faster to changes)
"""

import pandas as pd


def sma(prices: pd.Series, window: int) -> pd.Series:
    """Simple Moving Average — average of the last N closing prices."""
    return prices.rolling(window=window).mean()


def ema(prices: pd.Series, window: int) -> pd.Series:
    """Exponential Moving Average — weighted toward recent prices."""
    return prices.ewm(span=window, adjust=False).mean()
