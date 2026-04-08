"""Itinerary Optimiser — the brain of the travel agent.

This is where the magic happens. Given a list of possible
activities and the user's constraints (budget, days, location),
the optimiser builds the best possible day-by-day plan.

"Best" means: highest total review scores, lowest travel time
between stops, within budget. It's a constraint-satisfaction
problem — like fitting the best pieces into a puzzle where
the pieces are places to visit and the puzzle is your trip.

Two-stage approach:

Stage 1 — Assignment (OR-Tools CP-SAT solver):
  Decide which activities go on which day. Maximise total
  quality score while respecting budget, time, variety, and
  user preferences. This is the hard optimisation problem.

Stage 2 — Routing (brute-force permutations):
  For each day, find the best order to visit activities so
  you spend less time travelling between stops. With max 6
  activities per day, checking all 720 orderings is instant.

If the solver can't find a solution (e.g. constraints are
too tight), it falls back to a simpler greedy algorithm.
"""

from datetime import timedelta
import itertools
import math

from ortools.sat.python import cp_model

from travel.config import settings
from travel.models.trip import (
    Activity,
    ActivityType,
    DayPlan,
    Itinerary,
    TripRequest,
)


# --- Interest mapping ---
# Maps user-friendly keywords to activity types.
# "I'm interested in food" → boost restaurants and cafes.

INTEREST_TYPE_MAP: dict[str, set[ActivityType]] = {
    "food": {ActivityType.RESTAURANT, ActivityType.CAFE},
    "dining": {ActivityType.RESTAURANT},
    "coffee": {ActivityType.CAFE},
    "history": {ActivityType.ATTRACTION},
    "culture": {ActivityType.ATTRACTION, ActivityType.ENTERTAINMENT},
    "art": {ActivityType.ATTRACTION},
    "nightlife": {ActivityType.ENTERTAINMENT},
    "shopping": {ActivityType.SHOPPING},
    "sightseeing": {ActivityType.ATTRACTION},
    "nature": {ActivityType.ATTRACTION},
    "museums": {ActivityType.ATTRACTION},
}

INTEREST_BOOST = 1.5  # Score multiplier for matching activities


def score_activity(
    activity: Activity, interests: list[str] | None = None
) -> float:
    """Score an activity for ranking purposes.

    A place with 4.5 stars and 2000 reviews is more trustworthy
    than a place with 5.0 stars and 3 reviews. We use the log
    of review count to balance quality vs. confidence.

    If the user has stated interests (e.g. "food", "history"),
    activities that match get a 1.5x boost.
    """
    if activity.review_count == 0:
        base = activity.review_score
    else:
        base = activity.review_score * math.log10(max(activity.review_count, 1))

    if interests:
        matching_types: set[ActivityType] = set()
        for interest in interests:
            matching_types |= INTEREST_TYPE_MAP.get(interest.lower(), set())
        if matching_types and activity.activity_type in matching_types:
            base *= INTEREST_BOOST

    return base


def _calculate_travel_minutes(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> int:
    """Estimate travel time between two points (rough city estimate).

    Uses straight-line distance with a city travel factor.
    For MVP, this is good enough. Phase 2 will use Google
    Directions API for actual travel times.
    """
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


def _optimal_day_order(
    activities: list[Activity],
) -> tuple[list[Activity], int]:
    """Find the visit order that minimises total travel time.

    With max 6 activities per day, checking all permutations
    (6! = 720) is instant. For safety, if there are more than
    8 activities, use nearest-neighbour instead.
    """
    if len(activities) <= 1:
        return list(activities), 0

    if len(activities) > 8:
        return _nearest_neighbour_order(activities)

    best_order = list(activities)
    best_travel = float("inf")

    for perm in itertools.permutations(range(len(activities))):
        travel = sum(
            _calculate_travel_minutes(
                activities[perm[i]].latitude,
                activities[perm[i]].longitude,
                activities[perm[i + 1]].latitude,
                activities[perm[i + 1]].longitude,
            )
            for i in range(len(perm) - 1)
        )
        if travel < best_travel:
            best_travel = travel
            best_order = [activities[p] for p in perm]

    return best_order, best_travel


def _nearest_neighbour_order(
    activities: list[Activity],
) -> tuple[list[Activity], int]:
    """Nearest-neighbour heuristic for ordering — fallback for large days."""
    remaining = list(range(len(activities)))
    order = [remaining.pop(0)]
    total_travel = 0

    while remaining:
        last = order[-1]
        best_next = min(
            remaining,
            key=lambda j: _calculate_travel_minutes(
                activities[last].latitude,
                activities[last].longitude,
                activities[j].latitude,
                activities[j].longitude,
            ),
        )
        total_travel += _calculate_travel_minutes(
            activities[last].latitude,
            activities[last].longitude,
            activities[best_next].latitude,
            activities[best_next].longitude,
        )
        order.append(best_next)
        remaining.remove(best_next)

    return [activities[i] for i in order], total_travel


def _solve_assignment(
    candidates: list[Activity],
    num_days: int,
    daily_budget: float,
    max_per_day: int,
    max_minutes_per_day: int,
    locked_ids: set[str],
    interests: list[str] | None = None,
    time_limit_seconds: int = 10,
) -> list[list[Activity]] | None:
    """Use OR-Tools CP-SAT to assign activities to days optimally.

    This is the core optimisation: decide which activities go on
    which day to maximise total quality while respecting all
    constraints (budget, time, variety, locked items).

    Returns a list of activity lists (one per day), or None
    if no feasible solution exists.
    """
    model = cp_model.CpModel()
    n = len(candidates)

    # --- Decision variables ---
    # x[a, d] = 1 means activity a is scheduled on day d
    x = {}
    for a in range(n):
        for d in range(num_days):
            x[a, d] = model.new_bool_var(f"x_{a}_{d}")

    # --- Constraints ---

    # 1. Each activity on at most one day
    for a in range(n):
        model.add(sum(x[a, d] for d in range(num_days)) <= 1)

    # 2. Locked activities must appear exactly once
    for a in range(n):
        if candidates[a].id in locked_ids:
            model.add(sum(x[a, d] for d in range(num_days)) == 1)

    # 3. Max activities per day
    for d in range(num_days):
        model.add(sum(x[a, d] for a in range(n)) <= max_per_day)

    # 4. Budget per day (multiply by 100 to work with integers)
    budget_cents = int(daily_budget * 100)
    for d in range(num_days):
        model.add(
            sum(
                int(candidates[a].estimated_cost * 100) * x[a, d]
                for a in range(n)
            )
            <= budget_cents
        )

    # 5. Time per day (activity time + ~15 min transit per stop)
    transit_overhead = 15
    for d in range(num_days):
        model.add(
            sum(
                (candidates[a].estimated_minutes + transit_overhead) * x[a, d]
                for a in range(n)
            )
            <= max_minutes_per_day
        )

    # 6. Type variety — max 3 of any single type per day
    #    (you don't want 5 restaurants and 1 museum)
    max_same_type = min(3, max_per_day)
    for d in range(num_days):
        for act_type in ActivityType:
            type_indices = [
                a for a in range(n) if candidates[a].activity_type == act_type
            ]
            if len(type_indices) > max_same_type:
                model.add(
                    sum(x[a, d] for a in type_indices) <= max_same_type
                )

    # --- Objective: maximise total quality score ---
    # Scale to integers (CP-SAT works with integers)
    scores = [
        int(score_activity(candidates[a], interests) * 1000) for a in range(n)
    ]
    model.maximize(
        sum(scores[a] * x[a, d] for a in range(n) for d in range(num_days))
    )

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = time_limit_seconds
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return None

    # Extract which activities go on which day
    days_result: list[list[Activity]] = [[] for _ in range(num_days)]
    for a in range(n):
        for d in range(num_days):
            if solver.value(x[a, d]) == 1:
                days_result[d].append(candidates[a])

    return days_result


def _greedy_assignment(
    candidates: list[Activity],
    num_days: int,
    daily_budget: float,
    max_per_day: int,
    max_minutes_per_day: int,
    locked_ids: set[str],
    interests: list[str] | None = None,
) -> list[list[Activity]]:
    """Fallback greedy assignment if the OR-Tools solver fails.

    Simple approach: sort by score, assign each activity to the
    first day that has room for it.
    """
    scored = sorted(
        candidates, key=lambda a: score_activity(a, interests), reverse=True
    )

    days_result: list[list[Activity]] = [[] for _ in range(num_days)]
    used_ids: set[str] = set()
    transit_overhead = 15

    # First pass: place locked activities
    for activity in scored:
        if activity.id in locked_ids and activity.id not in used_ids:
            best_day = min(range(num_days), key=lambda d: len(days_result[d]))
            days_result[best_day].append(activity)
            used_ids.add(activity.id)

    # Second pass: fill remaining slots
    for activity in scored:
        if activity.id in used_ids:
            continue

        for d in range(num_days):
            day = days_result[d]
            if len(day) >= max_per_day:
                continue

            day_cost = sum(a.estimated_cost for a in day)
            if day_cost + activity.estimated_cost > daily_budget:
                continue

            day_time = sum(
                a.estimated_minutes + transit_overhead for a in day
            )
            if (
                day_time + activity.estimated_minutes + transit_overhead
                > max_minutes_per_day
            ):
                continue

            day.append(activity)
            used_ids.add(activity.id)
            break

    return days_result


def build_itinerary(
    request: TripRequest,
    activities: list[Activity],
    locked: list[str] | None = None,
    excluded: list[str] | None = None,
) -> Itinerary:
    """Build an optimised itinerary from available activities.

    This is the main entry point. It:
    1. Filters out excluded/low-rated activities
    2. Uses OR-Tools to assign activities to days (or greedy fallback)
    3. Optimises the visit order within each day
    4. Returns a complete day-by-day plan

    Args:
        request: The user's trip request (city, dates, budget)
        activities: All available activities from review providers
        locked: Activity IDs the user wants to keep (won't be removed)
        excluded: Activity IDs the user doesn't want (won't be added)

    Returns:
        An optimised Itinerary with day-by-day plans
    """
    locked_ids = set(locked or [])
    excluded_ids = set(excluded or [])

    # Filter: remove excluded, below minimum rating, and unwanted types
    candidates = [
        a
        for a in activities
        if a.id not in excluded_ids
        and a.review_score >= settings.min_review_score
        and a.activity_type not in request.excluded_types
    ]

    # Trip parameters
    num_days = (request.end_date - request.start_date).days
    if num_days <= 0:
        num_days = 1
    daily_budget = request.budget / num_days
    max_per_day = settings.max_activities_per_day
    max_minutes = 600  # 10 hours of active time

    if not candidates:
        return Itinerary(
            trip_request=request,
            days=[
                DayPlan(
                    day_number=d + 1,
                    date=request.start_date + timedelta(days=d),
                )
                for d in range(num_days)
            ],
            total_cost=0.0,
            total_activities=0,
            budget_remaining=request.budget,
        )

    # Stage 1: Assign activities to days
    days_assignment = _solve_assignment(
        candidates,
        num_days,
        daily_budget,
        max_per_day,
        max_minutes,
        locked_ids,
        request.interests,
        settings.max_optimisation_seconds,
    )

    if days_assignment is None:
        days_assignment = _greedy_assignment(
            candidates,
            num_days,
            daily_budget,
            max_per_day,
            max_minutes,
            locked_ids,
            request.interests,
        )

    # Stage 2: Optimise visit order within each day
    days: list[DayPlan] = []
    total_cost = 0.0
    total_score = 0.0

    for day_num in range(num_days):
        day_date = request.start_date + timedelta(days=day_num)
        day_activities = days_assignment[day_num]

        ordered, travel_minutes = _optimal_day_order(day_activities)

        day_cost = sum(a.estimated_cost for a in ordered)
        total_cost += day_cost
        total_score += sum(
            score_activity(a, request.interests) for a in ordered
        )

        days.append(
            DayPlan(
                day_number=day_num + 1,
                date=day_date,
                activities=ordered,
                total_cost=round(day_cost, 2),
                total_travel_minutes=travel_minutes,
            )
        )

    return Itinerary(
        trip_request=request,
        days=days,
        total_cost=round(total_cost, 2),
        total_activities=sum(len(d.activities) for d in days),
        budget_remaining=round(request.budget - total_cost, 2),
        optimisation_score=round(total_score, 2),
    )
