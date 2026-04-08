"""Tests for the itinerary optimiser.

These verify that the optimiser produces sensible plans
given a set of activities and constraints.
"""

from datetime import date

import pytest

from travel.core.optimiser import (
    build_itinerary,
    score_activity,
    _calculate_travel_minutes,
    _optimal_day_order,
)
from travel.models.trip import Activity, ActivityType, TripRequest


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
