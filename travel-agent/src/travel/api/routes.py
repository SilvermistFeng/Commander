"""API routes — what the frontend can ask the backend to do.

The endpoints:

1. POST /api/plan       — Give me a city, dates, and budget. Get an itinerary.
2. POST /api/replan     — I changed my mind about some activities. Reoptimise.
3. GET  /api/activities — Show me what's available in this city.
4. GET  /api/cities     — Which cities can you plan for right now?
5. POST /api/export/ics — Give me that plan as a calendar file.

Each endpoint maps to a clear user action. The frontend calls
these, the backend does the work, and sends back the result.
"""

from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel

from travel.config import settings
from travel.core.calendar import ics_filename, itinerary_to_ics
from travel.core.optimiser import build_itinerary
from travel.models.trip import Activity, Itinerary, TripRequest
from travel.services.reviews.base import ReviewProvider
from travel.services.reviews.demo import DemoProvider, demo_cities
from travel.services.reviews.google_places import GooglePlacesProvider

router = APIRouter()

# The kinds of place we pull in when planning a whole trip
PLANNING_TYPES = ["attraction", "restaurant", "cafe", "entertainment", "shopping"]


def _get_provider() -> ReviewProvider:
    """Return the right data provider based on available API keys.

    If a Google API key is set, use real data.
    If not, use demo data so the app still works.
    """
    if settings.google_places_api_key:
        return GooglePlacesProvider()
    return DemoProvider()


def _destination(request: TripRequest) -> str:
    """City and country as one search string."""
    return f"{request.city}, {request.country}" if request.country else request.city


class PlanResponse(BaseModel):
    """What the API returns when you ask for a trip plan."""

    itinerary: Itinerary
    available_alternatives: list[Activity] = []


class ReplanRequest(BaseModel):
    """What the frontend sends when the user modifies their trip."""

    trip_request: TripRequest
    locked_activity_ids: list[str] = []    # Keep these
    excluded_activity_ids: list[str] = []  # Remove these


class CityOption(BaseModel):
    """A city the app can plan for."""

    city: str
    country: str = ""


class CitiesResponse(BaseModel):
    """Which cities are available, and whether we're on live data."""

    mode: str                      # "live" (any city) or "demo" (fixed list)
    cities: list[CityOption] = []


def _alternatives(
    activities: list[Activity], itinerary: Itinerary, limit: int = 20
) -> list[Activity]:
    """Everything we found but didn't schedule — the user can swap these in."""
    used_ids = {a.id for day in itinerary.days for a in day.activities}
    return [a for a in activities if a.id not in used_ids][:limit]


@router.post("/plan", response_model=PlanResponse)
async def plan_trip(request: TripRequest) -> PlanResponse:
    """Create an optimised itinerary for a trip.

    The user provides: city, dates, budget, pace.
    The backend: fetches activities, scores them, optimises the route,
    schedules each stop against the clock, and returns a day-by-day plan.
    """
    provider = _get_provider()

    try:
        activities = await provider.search_activities(
            city=_destination(request),
            activity_types=PLANNING_TYPES,
            limit=100,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not activities:
        detail = f"No activities found in {request.city}."
        if isinstance(provider, DemoProvider):
            names = ", ".join(c["city"] for c in demo_cities())
            detail += (
                f" Demo mode supports: {names}."
                " Add a Google Places API key for any city."
            )
        raise HTTPException(status_code=404, detail=detail)

    itinerary = build_itinerary(request, activities)

    return PlanResponse(
        itinerary=itinerary,
        available_alternatives=_alternatives(activities, itinerary),
    )


@router.post("/replan", response_model=PlanResponse)
async def replan_trip(request: ReplanRequest) -> PlanResponse:
    """Re-optimise after the user adds or removes activities.

    This is the killer feature: the user says "I don't want this
    museum" or "add this restaurant" and the itinerary rebuilds
    automatically around their choices.
    """
    provider = _get_provider()

    activities = await provider.search_activities(
        city=_destination(request.trip_request),
        activity_types=PLANNING_TYPES,
        limit=100,
    )

    if not activities:
        raise HTTPException(
            status_code=404,
            detail=f"No activities found in {request.trip_request.city}.",
        )

    itinerary = build_itinerary(
        request.trip_request,
        activities,
        locked=request.locked_activity_ids,
        excluded=request.excluded_activity_ids,
    )

    return PlanResponse(
        itinerary=itinerary,
        available_alternatives=_alternatives(activities, itinerary),
    )


@router.get("/activities")
async def list_activities(
    city: str,
    country: str = "",
    activity_type: str = "attraction",
    limit: int = 20,
) -> list[Activity]:
    """Browse available activities in a city.

    For users who want to explore what's available before
    planning a full trip.
    """
    provider = _get_provider()

    return await provider.search_activities(
        city=f"{city}, {country}" if country else city,
        activity_types=[activity_type],
        limit=limit,
    )


@router.get("/cities", response_model=CitiesResponse)
async def list_cities() -> CitiesResponse:
    """Which cities can we plan for?

    With a Google Places key, the answer is "anywhere" and the
    list comes back empty. Without one, we're on demo data and
    the frontend should show the user what it does know.
    """
    if settings.google_places_api_key:
        return CitiesResponse(mode="live", cities=[])

    return CitiesResponse(
        mode="demo",
        cities=[CityOption(**city) for city in demo_cities()],
    )


@router.post("/export/ics")
async def export_ics(itinerary: Itinerary) -> Response:
    """Download the itinerary as a calendar file.

    Every stop becomes a real appointment the traveller can open
    in Google Calendar, Apple Calendar or Outlook.
    """
    if not any(day.items for day in itinerary.days):
        raise HTTPException(
            status_code=400, detail="This itinerary has nothing scheduled yet."
        )

    filename = ics_filename(itinerary)

    return Response(
        content=itinerary_to_ics(itinerary),
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
