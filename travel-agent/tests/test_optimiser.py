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
) -> Activity:
    """Helper to create test activities."""
    return Activity(
        id=id,
        name=name,
        activity_type=ActivityType.ATTRACTION,
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


class TestTravelTime:
    def test_same_location_is_minimal(self):
        minutes = _calculate_travel_minutes(41.9, 12.5, 41.9, 12.5)
        assert minutes == 5  # Minimum floor

    def test_distant_locations_take_longer(self):
        near = _calculate_travel_minutes(41.9, 12.5, 41.91, 12.51)
        far = _calculate_travel_minutes(41.9, 12.5, 42.0, 12.7)
        assert far > near


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
            budget=100.0,  # Very tight budget
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
