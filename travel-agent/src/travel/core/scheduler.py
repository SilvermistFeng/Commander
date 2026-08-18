"""Day scheduler — turns a pile of activities into a timed plan.

The optimiser decides *what* you do on each day. This decides
*when*. That matters more than it sounds: a list saying
"Colosseum, dinner at Roscioli, Trevi Fountain" is useless if
it puts dinner at half past ten in the morning.

The rules it follows:

- The day starts at a sensible hour, set by the trip's pace.
- Meals land in meal windows — lunch around midday, dinner in
  the evening — not whenever the route happens to reach them.
- Everything else is ordered to keep walking and transit down.
- Travel time between stops is added to the clock, so the times
  you see are times you can actually keep.
"""

from datetime import date as date_type
from datetime import time, timedelta

from travel.core.geo import optimal_order, travel_between
from travel.models.trip import Activity, ActivityType, DayPlan, Pace, ScheduleItem

# --- Pace profiles ---
# How full a day looks at each pace: when it starts, how long
# the active part runs, and how many stops fit in.

PACE_PROFILES: dict[Pace, dict[str, int]] = {
    Pace.RELAXED: {"day_start": 10 * 60, "active_minutes": 480, "max_activities": 4},
    Pace.BALANCED: {"day_start": 9 * 60, "active_minutes": 600, "max_activities": 6},
    Pace.PACKED: {"day_start": 8 * 60, "active_minutes": 720, "max_activities": 8},
}

# --- Meal windows (minutes from midnight) ---
# "target" is when we'd like to sit down; "latest" is the point
# past which the meal stops being that meal.

MEAL_SLOTS: list[dict[str, int]] = [
    {"target": 12 * 60, "latest": 14 * 60},          # Lunch
    {"target": 18 * 60 + 30, "latest": 20 * 60 + 30},  # Dinner
]

MEAL_TYPES = {ActivityType.RESTAURANT}


def pace_profile(pace: Pace) -> dict[str, int]:
    """Return the day shape for a given pace."""
    return PACE_PROFILES.get(pace, PACE_PROFILES[Pace.BALANCED])


def _to_time(minutes: int) -> time:
    """Convert minutes-from-midnight into a clock time.

    Anything past midnight is clamped to 23:59 rather than
    rolling into the next day — a stop that runs that late is
    a planning problem, not a date-arithmetic problem.
    """
    minutes = max(0, min(minutes, 24 * 60 - 1))
    return time(hour=minutes // 60, minute=minutes % 60)


def _meal_is_due(
    clock: int, next_activity: Activity | None, slot: dict[str, int]
) -> bool:
    """Should we eat now?

    Yes if we've reached the meal's target time, or if squeezing
    in the next stop first would push the meal past the point
    where it still counts as that meal.
    """
    if clock >= slot["target"]:
        return True
    if next_activity is None:
        return False
    projected = clock + next_activity.estimated_minutes
    return projected > slot["latest"]


def build_day_schedule(
    activities: list[Activity],
    day_start_minutes: int,
) -> tuple[list[ScheduleItem], int]:
    """Lay a day's activities out against the clock.

    Returns the timed items in visit order, plus total travel
    minutes for the day.
    """
    if not activities:
        return [], 0

    meals = [a for a in activities if a.activity_type in MEAL_TYPES]
    others = [a for a in activities if a.activity_type not in MEAL_TYPES]

    queue, _ = optimal_order(others)
    pending_meals = list(meals)
    slots = [dict(slot) for slot in MEAL_SLOTS]

    items: list[ScheduleItem] = []
    clock = day_start_minutes
    total_travel = 0
    previous: Activity | None = None

    def place(activity: Activity, earliest: int | None = None) -> None:
        """Add an activity to the day, advancing the clock."""
        nonlocal clock, total_travel, previous

        travel = travel_between(previous, activity) if previous else 0
        start = clock + travel
        if earliest is not None and start < earliest:
            start = earliest

        end = start + activity.estimated_minutes
        items.append(
            ScheduleItem(
                activity=activity,
                start_time=_to_time(start),
                end_time=_to_time(end),
                travel_minutes_from_previous=travel,
            )
        )
        total_travel += travel
        clock = end
        previous = activity

    while queue or pending_meals:
        next_activity = queue[0] if queue else None

        if pending_meals and slots and _meal_is_due(clock, next_activity, slots[0]):
            slot = slots.pop(0)
            # Of the meals left, take whichever is closest to where we are
            meal = (
                min(pending_meals, key=lambda m: travel_between(previous, m))
                if previous
                else pending_meals[0]
            )
            pending_meals.remove(meal)
            place(meal, earliest=slot["target"])
            continue

        if queue:
            place(queue.pop(0))
            continue

        # Nothing left but meals with no slot of their own — serve them in turn
        meal = pending_meals.pop(0)
        earliest = slots.pop(0)["target"] if slots else None
        place(meal, earliest=earliest)

    return items, total_travel


def build_day_plan(
    day_number: int,
    day_date: date_type,
    activities: list[Activity],
    day_start_minutes: int,
) -> DayPlan:
    """Build a complete, timed DayPlan from a day's activities."""
    items, travel = build_day_schedule(activities, day_start_minutes)
    cost = sum(item.activity.estimated_cost for item in items)

    return DayPlan(
        day_number=day_number,
        date=day_date,
        items=items,
        total_cost=round(cost, 2),
        total_travel_minutes=travel,
    )


def day_date_for(start: date_type, day_index: int) -> date_type:
    """The calendar date of day N of the trip (day 0 = start date)."""
    return start + timedelta(days=day_index)
