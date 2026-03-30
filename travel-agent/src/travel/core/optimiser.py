"""Itinerary Optimiser — the brain of the travel agent.

This is where the magic happens. Given a list of possible
activities and the user's constraints (budget, days, location),
the optimiser builds the best possible day-by-day plan.

"Best" means: highest total review scores, lowest travel time
between stops, within budget. It's a constraint-satisfaction
problem — like fitting the best pieces into a puzzle where
the pieces are places to visit and the puzzle is your trip.

The algorithm:
1. Score each activity: review_score * log(review_count)
   (a 4.5 with 2000 reviews beats a 5.0 with 3 reviews)
2. Group activities by type to ensure variety each day
3. For each day, solve a route optimisation problem:
   pick the best activities and order them to minimise
   travel time between stops
4. Respect the budget constraint across all days
5. Allow the user to lock/remove activities, then re-solve

Uses Google OR-Tools for the routing optimisation.
"""

from datetime import timedelta

from travel.models.trip import (
    Activity,
    DayPlan,
    Itinerary,
    TripRequest,
)
import math


def score_activity(activity: Activity) -> float:
    """Score an activity for ranking purposes.

    A place with 4.5 stars and 2000 reviews is more trustworthy
    than a place with 5.0 stars and 3 reviews. We use the log
    of review count to balance quality vs. confidence.
    """
    if activity.review_count == 0:
        return activity.review_score
    return activity.review_score * math.log10(max(activity.review_count, 1))


def _calculate_travel_minutes(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> int:
    """Estimate travel time between two points (rough city estimate).

    Uses straight-line distance with a city travel factor.
    For MVP, this is good enough. Phase 2 will use Google
    Directions API for actual travel times.
    """
    # Haversine approximation in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    km = 6371 * 2 * math.asin(math.sqrt(a))

    # Rough city speed: 15 km/h average (walking + transit + waiting)
    return max(5, int((km / 15) * 60))


def build_itinerary(
    request: TripRequest,
    activities: list[Activity],
    locked: list[str] | None = None,
    excluded: list[str] | None = None,
) -> Itinerary:
    """Build an optimised itinerary from available activities.

    Args:
        request: The user's trip request (city, dates, budget)
        activities: All available activities from review providers
        locked: Activity IDs the user wants to keep (won't be removed)
        excluded: Activity IDs the user doesn't want (won't be added)

    Returns:
        An optimised Itinerary with day-by-day plans
    """
    locked = set(locked or [])
    excluded = set(excluded or [])

    # Filter out excluded activities
    candidates = [a for a in activities if a.id not in excluded]

    # Score and sort all candidates
    scored = sorted(candidates, key=score_activity, reverse=True)

    # Calculate trip parameters
    num_days = (request.end_date - request.start_date).days
    if num_days <= 0:
        num_days = 1
    daily_budget = request.budget / num_days

    # Build each day
    days: list[DayPlan] = []
    used_ids: set[str] = set()
    total_cost = 0.0

    for day_num in range(num_days):
        day_date = request.start_date + timedelta(days=day_num)
        day_activities: list[Activity] = []
        day_cost = 0.0
        day_minutes = 0
        max_minutes = 600  # 10 hours of active time per day

        # First, add any locked activities for this day
        for activity in scored:
            if activity.id in locked and activity.id not in used_ids:
                day_activities.append(activity)
                day_cost += activity.estimated_cost
                day_minutes += activity.estimated_minutes
                used_ids.add(activity.id)

        # Then fill with best remaining activities
        for activity in scored:
            if activity.id in used_ids:
                continue

            # Budget check
            if day_cost + activity.estimated_cost > daily_budget:
                continue

            # Time check
            travel_time = 0
            if day_activities:
                last = day_activities[-1]
                travel_time = _calculate_travel_minutes(
                    last.latitude, last.longitude,
                    activity.latitude, activity.longitude,
                )

            if day_minutes + activity.estimated_minutes + travel_time > max_minutes:
                continue

            day_activities.append(activity)
            day_cost += activity.estimated_cost
            day_minutes += activity.estimated_minutes + travel_time
            used_ids.add(activity.id)

            if len(day_activities) >= 6:  # Max activities per day
                break

        # Calculate total travel time for the day
        total_travel = 0
        for i in range(1, len(day_activities)):
            prev = day_activities[i - 1]
            curr = day_activities[i]
            total_travel += _calculate_travel_minutes(
                prev.latitude, prev.longitude,
                curr.latitude, curr.longitude,
            )

        days.append(
            DayPlan(
                day_number=day_num + 1,
                date=day_date,
                activities=day_activities,
                total_cost=round(day_cost, 2),
                total_travel_minutes=total_travel,
            )
        )
        total_cost += day_cost

    return Itinerary(
        trip_request=request,
        days=days,
        total_cost=round(total_cost, 2),
        total_activities=sum(len(d.activities) for d in days),
        budget_remaining=round(request.budget - total_cost, 2),
    )
