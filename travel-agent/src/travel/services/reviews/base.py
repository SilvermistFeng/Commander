"""Abstract review provider — all review sources implement this.

The key design decision: review sources are swappable per region.
Google Places is the global default. Tabelog replaces it in Japan.
Dianping replaces it in China. The optimiser doesn't care where
the ratings come from — it just sees scores.

To add a new review source:
1. Create a new file (e.g. tabelog.py)
2. Implement the ReviewProvider interface
3. Register it in the REGION_PROVIDERS mapping
"""

from abc import ABC, abstractmethod

from travel.models.trip import Activity


class ReviewProvider(ABC):
    """Base class for all review data sources."""

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Name of this review source (e.g. 'google', 'tabelog')."""
        ...

    @abstractmethod
    async def search_activities(
        self,
        city: str,
        activity_types: list[str],
        limit: int = 50,
    ) -> list[Activity]:
        """Search for activities in a city.

        Returns a list of Activity objects with review scores,
        locations, and cost estimates from this review source.
        """
        ...


# Region-to-provider mapping — this is where localised
# review sources get registered as they're built.
# Default: Google Places (global fallback)
REGION_PROVIDERS: dict[str, type[ReviewProvider]] = {
    # "JP": TabelogProvider,    # Phase 2 — Japan
    # "CN": DianpingProvider,   # Phase 2 — China
}
