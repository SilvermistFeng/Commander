"""Configuration — all settings live here, not scattered in code.

This uses Pydantic for settings validation. Every parameter that
controls how the system behaves is defined here. To change a
setting, edit the config — never hardcode values in other files.
"""

from dataclasses import dataclass


@dataclass
class Config:
    """Trading signals configuration."""

    # Data source
    default_ticker: str = "AAPL"
    lookback_days: int = 365

    # Strategy parameters (these will be tuned via backtesting)
    sma_short_window: int = 20
    sma_long_window: int = 50
    rsi_period: int = 14
    rsi_overbought: float = 70.0
    rsi_oversold: float = 30.0

    # Risk management
    max_position_pct: float = 0.02  # Max 2% of portfolio per position
    stop_loss_pct: float = 0.05     # 5% stop loss

    # Backtesting
    initial_capital: float = 100_000.0
    commission_pct: float = 0.001   # 0.1% per trade (realistic)
