"""Momentum indicators — RSI and MACD.

These measure the speed and strength of price movements.
Think of momentum like pushing a ball uphill — at some point
the push weakens and the ball starts rolling back. These
indicators try to spot that turning point.

- RSI (Relative Strength Index): 0-100 scale. Above 70 = possibly
  overbought (might fall). Below 30 = possibly oversold (might rise).
- MACD: Shows the relationship between two moving averages. When
  they cross, it can signal a trend change.
"""

import pandas as pd


def rsi(prices: pd.Series, period: int = 14) -> pd.Series:
    """Relative Strength Index — measures if a stock is overbought or oversold."""
    delta = prices.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()

    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))


def macd(
    prices: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """MACD — Moving Average Convergence Divergence.

    Returns:
        macd_line: The difference between fast and slow EMAs
        signal_line: EMA of the MACD line (the "trigger")
        histogram: Difference between MACD and signal (visual aid)
    """
    fast_ema = prices.ewm(span=fast, adjust=False).mean()
    slow_ema = prices.ewm(span=slow, adjust=False).mean()

    macd_line = fast_ema - slow_ema
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    return macd_line, signal_line, histogram
