"""Tests for the day scheduler.

These check that a day's activities come back with sensible
clock times: meals at mealtimes, travel time accounted for,
and nothing overlapping.
"""

from datetime import date, time

from travel.core.scheduler import (
    MEAL_SLOTS,
    PACE_PROFILES,
    build_day_plan,
    build_day_schedule,
    day_date_for,
    pace_profile,
)
from travel.models.trip import Activity, ActivityType, Pace

LUNCH_TARGET = MEAL_SLOTS[0]["target"]
DINNER_TARGET = MEAL_SLOTS[1]["target"]


def _make_activity(
    id: str,
    name: str = "Place",
    activity_type: ActivityType = ActivityType.ATTRACTION,
    minutes: int = 60,
    cost: float = 10.0,
    lat: float = 41.90,
    lon: float = 12.49,
) -> Activity:
    return Activity(
        id=id,
        name=name,
        activity_type=activity_type,
        latitude=lat,
        longitude=lon,
        review_score=4.5,
        review_count=1000,
        estimated_cost=cost,
        estimated_minutes=minutes,
    )


def _minutes(value: time) -> int:
    return value.hour * 60 + value.minute


class TestDaySchedule:
    def test_empty_day_returns_nothing(self):
        items, travel = build_day_schedule([], 9 * 60)
        assert items == []
        assert travel == 0

    def test_first_activity_starts_at_day_start(self):
        items, _ = build_day_schedule([_make_activity("a")], 9 * 60)
        assert items[0].start_time == time(9, 0)
        assert items[0].travel_minutes_from_previous == 0

    def test_end_time_reflects_duration(self):
        items, _ = build_day_schedule([_make_activity("a", minutes=90)], 9 * 60)
        assert items[0].end_time == time(10, 30)

    def test_stops_do_not_overlap(self):
        activities = [
            _make_activity("a", minutes=60),
            _make_activity("b", minutes=45, lat=41.95),
            _make_activity("c", minutes=30, lat=41.88),
        ]
        items, _ = build_day_schedule(activities, 9 * 60)

        for earlier, later in zip(items, items[1:]):
            assert _minutes(later.start_time) >= _minutes(earlier.end_time)

    def test_travel_time_pushes_the_clock(self):
        near = _make_activity("a", minutes=60)
        far = _make_activity("b", minutes=60, lat=42.30, lon=12.90)
        items, travel = build_day_schedule([near, far], 9 * 60)

        second = items[1]
        assert second.travel_minutes_from_previous > 0
        assert travel == second.travel_minutes_from_previous
        assert _minutes(second.start_time) == (
            _minutes(items[0].end_time) + second.travel_minutes_from_previous
        )

    def test_lunch_lands_in_the_lunch_window(self):
        activities = [
            _make_activity("a", minutes=60),
            _make_activity("lunch", "Trattoria", ActivityType.RESTAURANT, 60),
            _make_activity("b", minutes=60),
        ]
        items, _ = build_day_schedule(activities, 9 * 60)

        meal = next(
            i for i in items if i.activity.activity_type == ActivityType.RESTAURANT
        )
        assert _minutes(meal.start_time) >= LUNCH_TARGET
        assert _minutes(meal.start_time) <= MEAL_SLOTS[0]["latest"]

    def test_meal_is_not_served_at_breakfast_time(self):
        """A restaurant alone on a day still waits until lunchtime."""
        items, _ = build_day_schedule(
            [_make_activity("lunch", "Trattoria", ActivityType.RESTAURANT, 60)],
            9 * 60,
        )
        assert _minutes(items[0].start_time) == LUNCH_TARGET

    def test_two_meals_become_lunch_and_dinner(self):
        activities = [
            _make_activity("a", minutes=90),
            _make_activity("m1", "Lunch spot", ActivityType.RESTAURANT, 60),
            _make_activity("m2", "Dinner spot", ActivityType.RESTAURANT, 90),
            _make_activity("b", minutes=90),
        ]
        items, _ = build_day_schedule(activities, 9 * 60)

        meals = [
            i for i in items if i.activity.activity_type == ActivityType.RESTAURANT
        ]
        assert len(meals) == 2
        assert _minutes(meals[0].start_time) >= LUNCH_TARGET
        assert _minutes(meals[1].start_time) >= DINNER_TARGET

    def test_every_activity_is_scheduled(self):
        activities = [_make_activity(f"a{i}", minutes=45) for i in range(5)]
        activities.append(
            _make_activity("m", "Lunch", ActivityType.RESTAURANT, 60)
        )
        items, _ = build_day_schedule(activities, 9 * 60)

        assert {i.activity.id for i in items} == {a.id for a in activities}


class TestDayPlan:
    def test_day_plan_totals_the_costs(self):
        activities = [
            _make_activity("a", cost=20.0),
            _make_activity("b", cost=15.5, lat=41.92),
        ]
        plan = build_day_plan(1, date(2026, 9, 1), activities, 9 * 60)

        assert plan.total_cost == 35.5
        assert plan.day_number == 1
        assert len(plan.items) == 2

    def test_activities_property_preserves_order(self):
        activities = [_make_activity("a"), _make_activity("b", lat=41.95)]
        plan = build_day_plan(1, date(2026, 9, 1), activities, 9 * 60)

        assert plan.activities == [i.activity for i in plan.items]


class TestPace:
    def test_each_pace_has_a_profile(self):
        for pace in Pace:
            assert pace in PACE_PROFILES

    def test_relaxed_starts_later_and_does_less_than_packed(self):
        relaxed = pace_profile(Pace.RELAXED)
        packed = pace_profile(Pace.PACKED)

        assert relaxed["day_start"] > packed["day_start"]
        assert relaxed["max_activities"] < packed["max_activities"]
        assert relaxed["active_minutes"] < packed["active_minutes"]

    def test_day_start_is_honoured(self):
        profile = pace_profile(Pace.PACKED)
        items, _ = build_day_schedule([_make_activity("a")], profile["day_start"])
        assert _minutes(items[0].start_time) == profile["day_start"]


class TestDayDates:
    def test_day_date_counts_from_the_start(self):
        start = date(2026, 9, 1)
        assert day_date_for(start, 0) == start
        assert day_date_for(start, 3) == date(2026, 9, 4)
