"""Itinerary Optimiser — the brain of the travel agent.

This is where the magic happens. Given a list of possible
activities and the user's constraints (budget, days, pace,
must-visit places), the optimiser builds the best possible
day-by-day plan.

"Best" means: highest total review scores, lowest travel time
between stops, within budget. It's a constraint-satisfaction
problem — like fitting the best pieces into a puzzle where
the pieces are places to visit and the puzzle is your trip.

Three stages:

Stage 1 — Assignment (OR-Tools CP-SAT solver):
  Decide which activities go on which day. Maximise total
  quality score while respecting budget, time, variety, and
  user preferences. This is the hard optimisation problem.
  If the solver can't find a solution (e.g. constraints are
  too tight), it falls back to a simpler greedy algorithm.

Stage 2 — Routing:
  For each day, find the best order to visit activities so
  you spend less time travelling between stops.

Stage 3 — Scheduling (see scheduler.py):
  Put a clock time against every stop, with meals in meal
  windows and travel time accounted for.
"""

import math

from ortools.sat.python import cp_model

from travel.config import settings
from travel.core.geo import calculate_travel_minutes, optimal_order
from travel.core.scheduler import build_day_plan, day_date_for, pace_profile
from travel.models.trip import (
    Activity,
    ActivityType,
    DayPlan,
    Itinerary,
    TripRequest,
)

# Kept as internal aliases so the rest of the codebase (and the
# tests) have one obvious place to reach for these.
_calculate_travel_minutes = calculate_travel_minutes
_optimal_day_order = optimal_order


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

# How many of each kind of stop belongs in a single day.
# Sightseeing is the backbone of a trip, so attractions aren't
# capped here — the day's length and the pace limit those. The
# rest are capped so a day doesn't turn into four coffees and
# three shopping trips.
TYPE_DAILY_CAPS: dict[ActivityType, int] = {
    ActivityType.RESTAURANT: 2,      # Lunch and dinner
    ActivityType.CAFE: 2,
    ActivityType.SHOPPING: 2,
    ActivityType.ENTERTAINMENT: 2,
}

# Lunch and dinner — more sit-down meals than this in one day is a chore
MAX_MEALS_PER_DAY = TYPE_DAILY_CAPS[ActivityType.RESTAURANT]


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


def match_must_include(
    activities: list[Activity],
    wanted_names: list[str],
    excluded_ids: set[str] | None = None,
) -> tuple[set[str], list[str]]:
    """Find the activities the user specifically asked for by name.

    The user types "Colosseum" or "trevi"; we find the matching
    place in the catalogue. Matching is case-insensitive and
    partial, so they don't have to get the name exactly right.

    Returns the IDs we found, plus any names we couldn't match
    so the user can be told rather than silently ignored.
    """
    excluded_ids = excluded_ids or set()
    matched: set[str] = set()
    unmatched: list[str] = []

    for wanted in wanted_names:
        needle = wanted.strip().lower()
        if not needle:
            continue

        hits = [
            a
            for a in activities
            if needle in a.name.lower() and a.id not in excluded_ids
        ]
        if hits:
            # If several places match, take the best-reviewed one
            matched.add(max(hits, key=score_activity).id)
        else:
            unmatched.append(wanted)

    return matched, unmatched


def _solve_assignment(
    candidates: list[Activity],
    num_days: int,
    daily_budget: float,
    max_per_day: int,
    max_minutes_per_day: int,
    locked_ids: set[str],
    interests: list[str] | None = None,
    time_limit_seconds: int = 10,
    meal_balance: bool = True,
) -> list[list[Activity]] | None:
    """Use OR-Tools CP-SAT to assign activities to days optimally.

    This is the core optimisation: decide which activities go on
    which day to maximise total quality while respecting all
    constraints (budget, time, variety, locked items).

    With meal_balance on, every day is also required to have at
    least one restaurant and no more than two — otherwise the
    solver happily stacks all the best restaurants on one day
    and leaves you with nothing to eat on the others.

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

    # 6. Type variety — don't let one kind of stop take over a day
    #    (you don't want 5 restaurants and 1 museum)
    for act_type, cap in TYPE_DAILY_CAPS.items():
        type_indices = [
            a for a in range(n) if candidates[a].activity_type == act_type
        ]
        if len(type_indices) <= cap:
            continue
        for d in range(num_days):
            model.add(sum(x[a, d] for a in type_indices) <= min(cap, max_per_day))

    # 7. Meals — spread them out so every day has somewhere to eat
    if meal_balance:
        meal_indices = [
            a
            for a in range(n)
            if candidates[a].activity_type == ActivityType.RESTAURANT
        ]
        if len(meal_indices) >= num_days:
            for d in range(num_days):
                model.add(sum(x[a, d] for a in meal_indices) >= 1)

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
    first day that has room for it. Locked and must-visit places
    are placed first so they never get squeezed out.
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

            cap = TYPE_DAILY_CAPS.get(activity.activity_type)
            if cap is not None:
                same_type = sum(
                    1 for a in day if a.activity_type == activity.activity_type
                )
                if same_type >= cap:
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
    """Build an optimised, timed itinerary from available activities.

    This is the main entry point. It:
    1. Finds the places the user specifically asked for by name
    2. Filters out excluded/low-rated activities
    3. Uses OR-Tools to assign activities to days (or greedy fallback)
    4. Optimises the visit order and puts clock times against each stop

    Args:
        request: The user's trip request (city, dates, budget, pace)
        activities: All available activities from review providers
        locked: Activity IDs the user wants to keep (won't be removed)
        excluded: Activity IDs the user doesn't want (won't be added)

    Returns:
        An optimised Itinerary with day-by-day, hour-by-hour plans
    """
    locked_ids = set(locked or [])
    excluded_ids = set(excluded or [])

    # Places the user named explicitly ("I must see the Colosseum").
    # These are locked in and bypass the quality filter — if they
    # asked for it, they get it.
    must_ids, unmatched = match_must_include(
        activities, request.must_include, excluded_ids
    )
    locked_ids |= must_ids

    # Filter: remove excluded, below minimum rating, and unwanted types
    candidates = [
        a
        for a in activities
        if a.id not in excluded_ids
        and (
            a.id in must_ids
            or (
                a.review_score >= settings.min_review_score
                and a.activity_type not in request.excluded_types
            )
        )
    ]

    # Trip parameters — pace decides how full each day is
    profile = pace_profile(request.pace)
    num_days = (request.end_date - request.start_date).days
    if num_days <= 0:
        num_days = 1
    daily_budget = request.budget / num_days
    max_per_day = min(profile["max_activities"], settings.max_activities_per_day)
    max_minutes = profile["active_minutes"]
    day_start = profile["day_start"]

    if not candidates:
        return Itinerary(
            trip_request=request,
            days=[
                DayPlan(
                    day_number=d + 1,
                    date=day_date_for(request.start_date, d),
                )
                for d in range(num_days)
            ],
            total_cost=0.0,
            total_activities=0,
            budget_remaining=request.budget,
            unmatched_must_include=unmatched,
        )

    # Stage 1: Assign activities to days. Try for a meal on every
    # day first; if that makes the problem unsolvable, drop the
    # requirement rather than give the user nothing.
    days_assignment = _solve_assignment(
        candidates,
        num_days,
        daily_budget,
        max_per_day,
        max_minutes,
        locked_ids,
        request.interests,
        settings.max_optimisation_seconds,
        meal_balance=True,
    )

    if days_assignment is None:
        days_assignment = _solve_assignment(
            candidates,
            num_days,
            daily_budget,
            max_per_day,
            max_minutes,
            locked_ids,
            request.interests,
            settings.max_optimisation_seconds,
            meal_balance=False,
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

    # Stages 2 and 3: route each day, then put it against the clock
    days: list[DayPlan] = []
    total_cost = 0.0
    total_score = 0.0

    for day_num in range(num_days):
        day_activities = days_assignment[day_num]
        day = build_day_plan(
            day_number=day_num + 1,
            day_date=day_date_for(request.start_date, day_num),
            activities=day_activities,
            day_start_minutes=day_start,
        )

        total_cost += day.total_cost
        total_score += sum(
            score_activity(a, request.interests) for a in day.activities
        )
        days.append(day)

    return Itinerary(
        trip_request=request,
        days=days,
        total_cost=round(total_cost, 2),
        total_activities=sum(len(d.items) for d in days),
        budget_remaining=round(request.budget - total_cost, 2),
        optimisation_score=round(total_score, 2),
        unmatched_must_include=unmatched,
    )
