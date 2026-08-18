"""Tests for the itinerary optimiser.

These verify that the optimiser produces sensible plans
given a set of activities and constraints.
"""

from datetime import date

import pytest

from travel.core.optimiser import (
    MAX_MEALS_PER_DAY,
    _calculate_travel_minutes,
    _optimal_day_order,
    build_itinerary,
    match_must_include,
    score_activity,
)
from travel.models.trip import Activity, ActivityType, Pace, TripRequest


def _make_activity(
    id: str,
    name: str,
    score: float = 4.0,
    count: int = 100,
    cost: float = 20.0,
    lat: float = 41.9,
    lon: float = 12.5,
    minutes: int = 60,
    activity_type: ActivityType = ActivityType.ATTRACTION,
) -> Activity:
    """Helper to create test activities."""
    return Activity(
        id=id,
        name=name,
        activity_type=activity_type,
        latitude=lat,
        longitude=lon,
        review_score=score,
        review_count=count,
        estimated_cost=cost,
        estimated_minutes=minutes,
    )


class TestScoring:
    def test_higher_rating_scores_higher(self):
        a = _make_activity("a", "Good", score=4.5, count=100)
        b = _make_activity("b", "Average", score=3.0, count=100)
        assert score_activity(a) > score_activity(b)

    def test_more_reviews_boosts_score(self):
        a = _make_activity("a", "Popular", score=4.0, count=5000)
        b = _make_activity("b", "Unknown", score=4.0, count=5)
        assert score_activity(a) > score_activity(b)

    def test_zero_reviews_returns_raw_score(self):
        a = _make_activity("a", "New", score=4.0, count=0)
        assert score_activity(a) == 4.0

    def test_interest_boost_increases_score(self):
        restaurant = _make_activity(
            "r", "Pasta Place", activity_type=ActivityType.RESTAURANT
        )
        score_no_interest = score_activity(restaurant)
        score_with_interest = score_activity(restaurant, interests=["food"])
        assert score_with_interest > score_no_interest

    def test_interest_boost_only_affects_matching_types(self):
        museum = _make_activity(
            "m", "Art Museum", activity_type=ActivityType.ATTRACTION
        )
        score_no_interest = score_activity(museum)
        score_food_interest = score_activity(museum, interests=["food"])
        assert score_food_interest == score_no_interest

    def test_no_interests_means_no_boost(self):
        a = _make_activity("a", "Place", activity_type=ActivityType.RESTAURANT)
        assert score_activity(a) == score_activity(a, interests=[])
        assert score_activity(a) == score_activity(a, interests=None)


class TestTravelTime:
    def test_same_location_is_minimal(self):
        minutes = _calculate_travel_minutes(41.9, 12.5, 41.9, 12.5)
        assert minutes == 5  # Minimum floor

    def test_distant_locations_take_longer(self):
        near = _calculate_travel_minutes(41.9, 12.5, 41.91, 12.51)
        far = _calculate_travel_minutes(41.9, 12.5, 42.0, 12.7)
        assert far > near


class TestDayOrdering:
    def test_single_activity_returns_unchanged(self):
        a = _make_activity("a", "Only One", lat=41.9, lon=12.5)
        ordered, travel = _optimal_day_order([a])
        assert ordered == [a]
        assert travel == 0

    def test_orders_to_minimise_travel(self):
        # Three activities in a line: north, middle, south
        north = _make_activity("n", "North", lat=42.0, lon=12.5)
        middle = _make_activity("m", "Middle", lat=41.95, lon=12.5)
        south = _make_activity("s", "South", lat=41.9, lon=12.5)

        # Regardless of input order, optimal should be a straight line
        ordered, _ = _optimal_day_order([south, north, middle])
        names = [a.id for a in ordered]
        assert names == ["n", "m", "s"] or names == ["s", "m", "n"]

    def test_empty_returns_empty(self):
        ordered, travel = _optimal_day_order([])
        assert ordered == []
        assert travel == 0


class TestItineraryBuilder:
    def test_respects_budget(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}", cost=50.0)
            for i in range(20)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=100.0,
        )
        result = build_itinerary(request, activities)
        assert result.total_cost <= 100.0

    def test_produces_correct_number_of_days(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}")
            for i in range(20)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 4),
            budget=1000.0,
        )
        result = build_itinerary(request, activities)
        assert len(result.days) == 3

    def test_excludes_activities(self):
        activities = [
            _make_activity("keep", "Keep This", score=5.0),
            _make_activity("skip", "Skip This", score=5.0),
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
        )
        result = build_itinerary(request, activities, excluded=["skip"])
        all_ids = {
            a.id for day in result.days for a in day.activities
        }
        assert "skip" not in all_ids
        assert "keep" in all_ids

    def test_empty_activities_produces_empty_itinerary(self):
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
        )
        result = build_itinerary(request, [])
        assert result.total_activities == 0

    def test_locks_activities(self):
        activities = [
            _make_activity("must", "Must Visit", score=3.5, cost=10.0),
            _make_activity("opt", "Optional", score=5.0, cost=10.0),
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
        )
        result = build_itinerary(request, activities, locked=["must"])
        all_ids = {
            a.id for day in result.days for a in day.activities
        }
        assert "must" in all_ids

    def test_max_activities_per_day_respected(self):
        activities = [
            _make_activity(
                f"a{i}", f"Place {i}", cost=5.0, minutes=30,
                lat=41.9 + i * 0.001, lon=12.5,
            )
            for i in range(30)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=10000.0,
        )
        result = build_itinerary(request, activities)
        for day in result.days:
            assert len(day.activities) <= 6

    def test_type_variety_enforced(self):
        # 10 restaurants — solver should cap at 3 per day
        activities = [
            _make_activity(
                f"r{i}", f"Restaurant {i}",
                activity_type=ActivityType.RESTAURANT,
                cost=15.0, minutes=60,
            )
            for i in range(10)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=1000.0,
        )
        result = build_itinerary(request, activities)
        for day in result.days:
            assert len(day.activities) <= 3

    def test_optimisation_score_populated(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}")
            for i in range(10)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=1000.0,
        )
        result = build_itinerary(request, activities)
        assert result.optimisation_score > 0

    def test_budget_remaining_correct(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}", cost=20.0)
            for i in range(5)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=500.0,
        )
        result = build_itinerary(request, activities)
        assert result.budget_remaining == pytest.approx(
            500.0 - result.total_cost
        )


class TestMustInclude:
    def test_finds_a_place_by_partial_name(self):
        activities = [
            _make_activity("t", "Trevi Fountain"),
            _make_activity("c", "Colosseum"),
        ]
        matched, unmatched = match_must_include(activities, ["trevi"])
        assert matched == {"t"}
        assert unmatched == []

    def test_reports_names_it_cannot_find(self):
        activities = [_make_activity("c", "Colosseum")]
        matched, unmatched = match_must_include(activities, ["Atlantis"])
        assert matched == set()
        assert unmatched == ["Atlantis"]

    def test_picks_the_best_reviewed_of_several_matches(self):
        activities = [
            _make_activity("poor", "Pizza Place", score=3.6, count=50),
            _make_activity("great", "Pizza Palace", score=4.8, count=9000),
        ]
        matched, _ = match_must_include(activities, ["pizza"])
        assert matched == {"great"}

    def test_ignores_blank_entries(self):
        activities = [_make_activity("c", "Colosseum")]
        matched, unmatched = match_must_include(activities, ["  ", ""])
        assert matched == set()
        assert unmatched == []

    def test_skips_places_the_user_already_removed(self):
        activities = [_make_activity("c", "Colosseum")]
        matched, unmatched = match_must_include(
            activities, ["Colosseum"], excluded_ids={"c"}
        )
        assert matched == set()
        assert unmatched == ["Colosseum"]

    def test_must_visit_place_appears_in_the_itinerary(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}", score=5.0, count=10000)
            for i in range(10)
        ]
        activities.append(
            _make_activity("hidden", "Tiny Chapel", score=4.0, count=12)
        )
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
            must_include=["tiny chapel"],
        )
        result = build_itinerary(request, activities)
        all_ids = {a.id for day in result.days for a in day.activities}
        assert "hidden" in all_ids

    def test_must_visit_beats_the_quality_filter(self):
        """A place the user asked for gets in even if it's poorly rated."""
        activities = [
            _make_activity("good", "Good Museum", score=4.8),
            _make_activity("scruffy", "Scruffy Bar", score=1.5),
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
            must_include=["Scruffy Bar"],
        )
        result = build_itinerary(request, activities)
        all_ids = {a.id for day in result.days for a in day.activities}
        assert "scruffy" in all_ids

    def test_unfound_names_are_reported_back(self):
        activities = [_make_activity("a", "Colosseum")]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=1000.0,
            must_include=["Colosseum", "Narnia"],
        )
        result = build_itinerary(request, activities)
        assert result.unmatched_must_include == ["Narnia"]


class TestPacing:
    def _many_activities(self) -> list[Activity]:
        return [
            _make_activity(
                f"a{i}",
                f"Place {i}",
                cost=5.0,
                minutes=30,
                lat=41.9 + i * 0.001,
                lon=12.5,
            )
            for i in range(40)
        ]

    def _request(self, pace: Pace) -> TripRequest:
        return TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=2000.0,
            pace=pace,
        )

    def test_relaxed_plans_fewer_stops_than_packed(self):
        activities = self._many_activities()
        relaxed = build_itinerary(self._request(Pace.RELAXED), activities)
        packed = build_itinerary(self._request(Pace.PACKED), activities)
        assert relaxed.total_activities < packed.total_activities

    def test_relaxed_starts_later_in_the_day(self):
        activities = self._many_activities()
        relaxed = build_itinerary(self._request(Pace.RELAXED), activities)
        packed = build_itinerary(self._request(Pace.PACKED), activities)
        assert relaxed.days[0].items[0].start_time > packed.days[0].items[0].start_time

    def test_balanced_is_the_default(self):
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 2),
            budget=500.0,
        )
        assert request.pace == Pace.BALANCED


class TestMealBalance:
    def test_every_day_gets_somewhere_to_eat(self):
        activities = [
            _make_activity(
                f"see{i}", f"Sight {i}", cost=10.0, minutes=60,
                lat=41.9 + i * 0.002, lon=12.5,
            )
            for i in range(12)
        ]
        activities += [
            _make_activity(
                f"eat{i}", f"Restaurant {i}", cost=20.0, minutes=60,
                lat=41.9 + i * 0.002, lon=12.51,
                activity_type=ActivityType.RESTAURANT,
            )
            for i in range(6)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 4),
            budget=1500.0,
        )
        result = build_itinerary(request, activities)

        for day in result.days:
            meals = [
                a
                for a in day.activities
                if a.activity_type == ActivityType.RESTAURANT
            ]
            assert len(meals) >= 1, f"Day {day.day_number} has nowhere to eat"
            assert len(meals) <= MAX_MEALS_PER_DAY


class TestScheduledOutput:
    def test_every_stop_has_a_clock_time(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}", lat=41.9 + i * 0.002)
            for i in range(8)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=1000.0,
        )
        result = build_itinerary(request, activities)

        for day in result.days:
            for item in day.items:
                assert item.start_time < item.end_time

    def test_total_activities_matches_the_schedule(self):
        activities = [
            _make_activity(f"a{i}", f"Place {i}", lat=41.9 + i * 0.002)
            for i in range(10)
        ]
        request = TripRequest(
            city="Rome",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 3),
            budget=1000.0,
        )
        result = build_itinerary(request, activities)
        assert result.total_activities == sum(len(d.items) for d in result.days)
