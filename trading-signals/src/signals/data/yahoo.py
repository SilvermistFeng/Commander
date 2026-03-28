"""Yahoo Finance data provider — free, no API key needed.

This is our starting data source. It provides historical stock
data via the yfinance library. Good enough for backtesting and
learning. When we need real-time data or options chains, we'll
add a paid provider that implements the same interface.
"""

from datetime import datetime, timedelta

import pandas as pd
import yfinance as yf

from signals.data.provider import DataProvider


class YahooProvider(DataProvider):
    """Fetch market data from Yahoo Finance."""

    def get_stock_data(
        self, ticker: str, period_days: int = 365
    ) -> pd.DataFrame:
        """Fetch historical stock data from Yahoo Finance."""
        end = datetime.now()
        start = end - timedelta(days=period_days)

        data = yf.download(
            ticker,
            start=start.strftime("%Y-%m-%d"),
            end=end.strftime("%Y-%m-%d"),
            progress=False,
        )

        if data.empty:
            raise ValueError(f"No data found for ticker: {ticker}")

        return data

    def get_options_chain(self, ticker: str) -> pd.DataFrame:
        """Phase 4 — options chain data."""
        raise NotImplementedError(
            "Options support is Phase 4. Not yet implemented."
        )
