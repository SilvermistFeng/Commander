"""Base strategy interface.

Every strategy implements this interface. This means we can
add new strategies without changing the backtest engine or
any other part of the system — just add a new file here.

A strategy takes price data and returns signals:
  1 = Buy, -1 = Sell, 0 = Hold
"""

from abc import ABC, abstractmethod

import pandas as pd


class Strategy(ABC):
    """Base class for all trading strategies."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name of this strategy."""
        ...

    @abstractmethod
    def generate_signals(self, data: pd.DataFrame) -> pd.Series:
        """Generate trading signals from price data.

        Args:
            data: DataFrame with Open, High, Low, Close, Volume columns

        Returns:
            Series of signals: 1 (buy), -1 (sell), 0 (hold)
        """
        ...
