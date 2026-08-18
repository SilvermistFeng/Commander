"""Trip models — define what a trip, day, and activity look like.

These are the core data structures. Everything in the app passes
data around using these models. Think of them as the blueprint
for what information exists about a trip.

- TripRequest: What the user asks for (city, dates, budget, pace)
- Activity: A single thing to do (restaurant, museum, park)
- ScheduleItem: An activity with a clock time attached
- DayPlan: One day's worth of scheduled activities, in order
- Itinerary: The complete trip plan across all days
"""

from datetime import date, time
from enum import Enum

from pydantic import BaseModel, Field


class ActivityType(str, Enum):
    """Types of things you can do on a trip."""

    ATTRACTION = "attraction"     # Museums, landmarks, parks
    RESTAURANT = "restaurant"     # Places to eat
    CAFE = "cafe"                 # Coffee, casual stops
    SHOPPING = "shopping"         # Markets, shops
    ENTERTAINMENT = "entertainment"  # Shows, nightlife
    TRANSPORT = "transport"       # Getting between places


class Pace(str, Enum):
    """How hard the traveller wants to push each day.

    Relaxed = a lie-in and fewer stops. Packed = early start,
    long day, more crammed in. Balanced sits in the middle and
    is the sensible default.
    """

    RELAXED = "relaxed"
    BALANCED = "balanced"
    PACKED = "packed"


class Activity(BaseModel):
    """A single activity or place to visit.

    This is the building block of an itinerary. Each activity
    has a location, a rating, an estimated cost, and a time
    estimate — everything the optimiser needs to plan.
    """

    id: str
    name: str
    activity_type: ActivityType
    latitude: float
    longitude: float
    review_score: float = Field(ge=0, le=5, description="Rating out of 5")
    review_count: int = 0
    review_source: str = "google"  # google, tabelog, dianping, etc.
    estimated_cost: float = 0.0    # In trip currency
    estimated_minutes: int = 60    # How long to spend here
    address: str = ""
    description: str = ""
    photo_url: str = ""
    opening_hours: str = ""        # Human-readable for now


class ScheduleItem(BaseModel):
    """One activity with a clock time attached.

    An itinerary is only useful if it tells you *when* to be
    somewhere, not just what to see. This wraps an activity
    with its start and end time, plus how long it takes to
    get there from the previous stop.
    """

    activity: Activity
    start_time: time
    end_time: time
    travel_minutes_from_previous: int = 0


class DayPlan(BaseModel):
    """One day's itinerary — a timed, ordered list of stops.

    The optimiser arranges these to minimise travel time
    between stops while maximising review scores and
    staying within the daily budget. The scheduler then
    puts a clock time against each one.
    """

    day_number: int
    date: date
    items: list[ScheduleItem] = []
    total_cost: float = 0.0
    total_travel_minutes: int = 0
    notes: str = ""

    @property
    def activities(self) -> list[Activity]:
        """The day's activities, in visit order — convenience for internal code."""
        return [item.activity for item in self.items]


class TripRequest(BaseModel):
    """What the user asks for — the input to the optimiser.

    This is the starting point. The user says: I want to go
    to Rome for 4 days with a budget of £800, at a relaxed
    pace, and I must see the Colosseum. The optimiser takes
    this and builds the best possible itinerary.
    """

    city: str
    country: str = ""
    start_date: date
    end_date: date
    budget: float
    currency: str = "USD"
    interests: list[str] = []      # e.g. ["food", "history", "art"]
    excluded_types: list[ActivityType] = []  # Things they don't want
    must_include: list[str] = []   # Specific places they want to visit
    hotel_location: str = ""       # Where they're staying (for routing)
    pace: Pace = Pace.BALANCED     # How full each day should be


class Itinerary(BaseModel):
    """The complete trip plan — the output of the optimiser.

    This is what the user sees: a day-by-day plan with
    activities, costs, and travel times. They can then
    add or remove activities, and the optimiser replans.
    """

    trip_request: TripRequest
    days: list[DayPlan] = []
    total_cost: float = 0.0
    total_activities: int = 0
    budget_remaining: float = 0.0
    optimisation_score: float = 0.0  # How "good" the plan is (internal metric)
    unmatched_must_include: list[str] = []  # Requested places we couldn't find
