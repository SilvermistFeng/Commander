"""Google Places review provider — the global default.

Uses Google Places API to find attractions, restaurants, and
activities in a city. Returns ratings, locations, and photos.
This is the fallback when no region-specific provider exists.

Google API docs: https://developers.google.com/maps/documentation/places/web-service
"""

import httpx

from travel.config import settings
from travel.models.trip import Activity, ActivityType
from travel.services.reviews.base import ReviewProvider

# Maps our activity types to Google Places types
GOOGLE_TYPE_MAP = {
    "attraction": ["tourist_attraction", "museum", "park", "point_of_interest"],
    "restaurant": ["restaurant"],
    "cafe": ["cafe"],
    "shopping": ["shopping_mall", "store"],
    "entertainment": ["night_club", "movie_theater", "amusement_park"],
}


class GooglePlacesProvider(ReviewProvider):
    """Fetch activities and reviews from Google Places API."""

    @property
    def source_name(self) -> str:
        return "google"

    async def search_activities(
        self,
        city: str,
        activity_types: list[str],
        limit: int = 50,
    ) -> list[Activity]:
        """Search Google Places for activities in a city."""
        if not settings.google_places_api_key:
            raise ValueError(
                "Google Places API key not set. "
                "Add GOOGLE_PLACES_API_KEY to your .env file."
            )

        activities: list[Activity] = []

        async with httpx.AsyncClient() as client:
            for activity_type in activity_types:
                google_types = GOOGLE_TYPE_MAP.get(activity_type, [activity_type])

                for google_type in google_types:
                    params = {
                        "query": f"{google_type} in {city}",
                        "key": settings.google_places_api_key,
                        "type": google_type,
                    }

                    response = await client.get(
                        "https://maps.googleapis.com/maps/api/place/textsearch/json",
                        params=params,
                        timeout=10,
                    )
                    response.raise_for_status()
                    data = response.json()

                    for place in data.get("results", [])[:limit]:
                        rating = place.get("rating", 0)

                        # Skip low-rated places
                        if rating < settings.min_review_score:
                            continue

                        activity = Activity(
                            id=place["place_id"],
                            name=place["name"],
                            activity_type=ActivityType(activity_type),
                            latitude=place["geometry"]["location"]["lat"],
                            longitude=place["geometry"]["location"]["lng"],
                            review_score=rating,
                            review_count=place.get("user_ratings_total", 0),
                            review_source="google",
                            address=place.get("formatted_address", ""),
                            estimated_cost=_estimate_cost(place, activity_type),
                            estimated_minutes=_estimate_duration(activity_type),
                        )
                        activities.append(activity)

        return activities[:limit]


def _estimate_cost(place: dict, activity_type: str) -> float:
    """Estimate cost based on Google's price_level (0-4) and type.

    Google's price_level:
    0 = Free, 1 = Inexpensive, 2 = Moderate, 3 = Expensive, 4 = Very Expensive

    These are rough estimates — better than nothing for budget planning.
    """
    price_level = place.get("price_level", 1)
    base_costs = {
        "attraction": [0, 10, 20, 40, 60],
        "restaurant": [5, 15, 30, 60, 100],
        "cafe": [0, 5, 10, 15, 20],
        "shopping": [0, 20, 50, 100, 200],
        "entertainment": [10, 25, 50, 80, 150],
    }
    costs = base_costs.get(activity_type, [0, 10, 25, 50, 100])
    return costs[min(price_level, 4)]


def _estimate_duration(activity_type: str) -> int:
    """Estimate how long someone spends at this type of place (minutes)."""
    durations = {
        "attraction": 90,
        "restaurant": 75,
        "cafe": 30,
        "shopping": 60,
        "entertainment": 120,
    }
    return durations.get(activity_type, 60)
