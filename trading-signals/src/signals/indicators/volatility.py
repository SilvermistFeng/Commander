"""Volatility indicators — Bollinger Bands and ATR.

Volatility measures how wildly prices swing. High volatility
means big swings (risky but opportunistic). Low volatility
means calm markets (stable but less opportunity).

- Bollinger Bands: A channel around the price. When price touches
  the top, it might be overextended. When it touches the bottom,
  it might be oversold. The width of the channel shows volatility.
- ATR (Average True Range): Measures how much a stock typically
  moves in a day. Useful for setting stop-losses — you don't want
  to be stopped out by normal daily movement.
"""

import pandas as pd


def bollinger_bands(
    prices: pd.Series, window: int = 20, num_std: float = 2.0
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Bollinger Bands — price channel based on standard deviation.

    Returns:
        upper: Upper band (overbought zone)
        middle: Middle band (SMA — the trend)
        lower: Lower band (oversold zone)
    """
    middle = prices.rolling(window=window).mean()
    std = prices.rolling(window=window).std()
    upper = middle + (std * num_std)
    lower = middle - (std * num_std)

    return upper, middle, lower


def atr(
    high: pd.Series,
    low: pd.Series,
    close: pd.Series,
    period: int = 14,
) -> pd.Series:
    """Average True Range — measures daily price volatility.

    Useful for setting stop-losses at a distance that respects
    normal market movement.
    """
    tr1 = high - low
    tr2 = (high - close.shift()).abs()
    tr3 = (low - close.shift()).abs()

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    return true_range.rolling(window=period).mean()
