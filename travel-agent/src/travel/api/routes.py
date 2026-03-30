"""API routes — what the frontend can ask the backend to do.

Three main endpoints:

1. POST /api/plan — Give me a city, dates, and budget. Get an itinerary.
2. POST /api/replan — I changed my mind about some activities. Reoptimise.
3. GET /api/activities — Show me what's available in this city.

Each endpoint maps to a clear user action. The frontend calls
these, the backend does the work, and sends back the result.
"""

from fastapi import APIRouter, HTTPException

from travel.core.optimiser import build_itinerary
from travel.models.trip import Activity, Itinerary, TripRequest
from travel.services.reviews.google_places import GooglePlacesProvider

from pydantic import BaseModel

router = APIRouter()


class PlanResponse(BaseModel):
    """What the API returns when you ask for a trip plan."""

    itinerary: Itinerary
    available_alternatives: list[Activity] = []


class ReplanRequest(BaseModel):
    """What the frontend sends when the user modifies their trip."""

    trip_request: TripRequest
    locked_activity_ids: list[str] = []    # Keep these
    excluded_activity_ids: list[str] = []  # Remove these


@router.post("/plan", response_model=PlanResponse)
async def plan_trip(request: TripRequest) -> PlanResponse:
    """Create an optimised itinerary for a trip.

    The user provides: city, dates, budget.
    The backend: fetches activities, scores them, optimises the route,
    and returns a day-by-day plan within budget.
    """
    provider = GooglePlacesProvider()

    try:
        activities = await provider.search_activities(
            city=f"{request.city}, {request.country}",
            activity_types=["attraction", "restaurant", "cafe", "entertainment"],
            limit=100,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not activities:
        raise HTTPException(
            status_code=404,
            detail=f"No activities found in {request.city}",
        )

    itinerary = build_itinerary(request, activities)

    # Activities not in the itinerary are alternatives the user can swap in
    used_ids = {
        a.id for day in itinerary.days for a in day.activities
    }
    alternatives = [a for a in activities if a.id not in used_ids]

    return PlanResponse(
        itinerary=itinerary,
        available_alternatives=alternatives[:20],
    )


@router.post("/replan", response_model=PlanResponse)
async def replan_trip(request: ReplanRequest) -> PlanResponse:
    """Re-optimise after the user adds or removes activities.

    This is the killer feature: the user says "I don't want this
    museum" or "add this restaurant" and the itinerary rebuilds
    automatically around their choices.
    """
    provider = GooglePlacesProvider()

    activities = await provider.search_activities(
        city=f"{request.trip_request.city}, {request.trip_request.country}",
        activity_types=["attraction", "restaurant", "cafe", "entertainment"],
        limit=100,
    )

    itinerary = build_itinerary(
        request.trip_request,
        activities,
        locked=request.locked_activity_ids,
        excluded=request.excluded_activity_ids,
    )

    used_ids = {
        a.id for day in itinerary.days for a in day.activities
    }
    alternatives = [a for a in activities if a.id not in used_ids]

    return PlanResponse(
        itinerary=itinerary,
        available_alternatives=alternatives[:20],
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
    provider = GooglePlacesProvider()

    activities = await provider.search_activities(
        city=f"{city}, {country}" if country else city,
        activity_types=[activity_type],
        limit=limit,
    )

    return activities
