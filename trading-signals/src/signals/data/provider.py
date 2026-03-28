"""Abstract data provider interface.

All data sources implement this interface. This means we can
swap Yahoo Finance for a paid API later without changing any
strategy or backtest code — only the data layer changes.
"""

from abc import ABC, abstractmethod

import pandas as pd


class DataProvider(ABC):
    """Base class for all data providers."""

    @abstractmethod
    def get_stock_data(
        self, ticker: str, period_days: int = 365
    ) -> pd.DataFrame:
        """Fetch historical stock data.

        Returns a DataFrame with columns:
            Open, High, Low, Close, Volume
        Index: DatetimeIndex
        """
        ...

    @abstractmethod
    def get_options_chain(self, ticker: str) -> pd.DataFrame:
        """Fetch current options chain data.

        Phase 4 — will be implemented when we add options support.
        """
        ...
