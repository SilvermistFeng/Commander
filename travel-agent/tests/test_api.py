"""Tests for the API endpoints.

These drive the app the way the frontend does — post a trip
request, get an itinerary back, export it as a calendar file.
They run against demo data, so no API key is needed.
"""

import pytest
from fastapi.testclient import TestClient

from travel.api.app import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def trip() -> dict:
    return {
        "city": "Rome",
        "country": "Italy",
        "start_date": "2026-09-01",
        "end_date": "2026-09-04",
        "budget": 600,
        "currency": "EUR",
        "interests": ["food", "history"],
        "must_include": ["Trevi"],
        "pace": "balanced",
    }


class TestHealth:
    def test_health_reports_demo_mode(self, client):
        body = client.get("/health").json()
        assert body["status"] == "ok"
        assert body["mode"] == "demo"
        assert "Rome" in body["demo_cities"]

    def test_health_lists_every_demo_city(self, client):
        from travel.services.reviews.demo import DEMO_CITIES

        body = client.get("/health").json()
        assert len(body["demo_cities"]) == len(DEMO_CITIES)


class TestCities:
    def test_lists_the_cities_we_can_plan_for(self, client):
        body = client.get("/api/cities").json()
        assert body["mode"] == "demo"
        assert {"city": "Rome", "country": "Italy"} in body["cities"]

    def test_every_city_has_a_country(self, client):
        body = client.get("/api/cities").json()
        assert all(c["country"] for c in body["cities"])


class TestPlan:
    def test_returns_a_timed_itinerary(self, client, trip):
        res = client.post("/api/plan", json=trip)
        assert res.status_code == 200

        itinerary = res.json()["itinerary"]
        assert len(itinerary["days"]) == 3
        assert itinerary["total_activities"] > 0

        first_stop = itinerary["days"][0]["items"][0]
        assert first_stop["start_time"] < first_stop["end_time"]
        assert first_stop["activity"]["name"]

    def test_stays_within_budget(self, client, trip):
        itinerary = client.post("/api/plan", json=trip).json()["itinerary"]
        assert itinerary["total_cost"] <= trip["budget"]
        assert itinerary["budget_remaining"] >= 0

    def test_must_visit_place_is_included(self, client, trip):
        itinerary = client.post("/api/plan", json=trip).json()["itinerary"]
        names = [
            item["activity"]["name"]
            for day in itinerary["days"]
            for item in day["items"]
        ]
        assert any("Trevi" in name for name in names)
        assert itinerary["unmatched_must_include"] == []

    def test_offers_alternatives(self, client, trip):
        body = client.post("/api/plan", json=trip).json()
        planned = {
            item["activity"]["id"]
            for day in body["itinerary"]["days"]
            for item in day["items"]
        }
        alternative_ids = {a["id"] for a in body["available_alternatives"]}
        assert not planned & alternative_ids

    def test_unknown_city_explains_demo_mode(self, client, trip):
        res = client.post("/api/plan", json={**trip, "city": "Atlantis"})
        assert res.status_code == 404
        assert "Demo mode supports" in res.json()["detail"]

    def test_pace_changes_the_start_of_the_day(self, client, trip):
        relaxed = client.post("/api/plan", json={**trip, "pace": "relaxed"}).json()
        packed = client.post("/api/plan", json={**trip, "pace": "packed"}).json()

        relaxed_start = relaxed["itinerary"]["days"][0]["items"][0]["start_time"]
        packed_start = packed["itinerary"]["days"][0]["items"][0]["start_time"]
        assert relaxed_start > packed_start


class TestReplan:
    def test_removing_a_place_keeps_it_out(self, client, trip):
        planned = client.post("/api/plan", json=trip).json()
        unwanted = planned["itinerary"]["days"][0]["items"][0]["activity"]["id"]

        res = client.post(
            "/api/replan",
            json={
                "trip_request": trip,
                "locked_activity_ids": [],
                "excluded_activity_ids": [unwanted],
            },
        )
        assert res.status_code == 200

        ids = {
            item["activity"]["id"]
            for day in res.json()["itinerary"]["days"]
            for item in day["items"]
        }
        assert unwanted not in ids

    def test_adding_a_place_locks_it_in(self, client, trip):
        # A short, relaxed trip so there are places left over to add
        short_trip = {**trip, "end_date": "2026-09-02", "pace": "relaxed"}
        planned = client.post("/api/plan", json=short_trip).json()
        assert planned["available_alternatives"], "expected leftover places"
        wanted = planned["available_alternatives"][0]["id"]

        res = client.post(
            "/api/replan",
            json={
                "trip_request": short_trip,
                "locked_activity_ids": [wanted],
                "excluded_activity_ids": [],
            },
        )
        ids = {
            item["activity"]["id"]
            for day in res.json()["itinerary"]["days"]
            for item in day["items"]
        }
        assert wanted in ids


class TestCalendarExport:
    def test_downloads_a_calendar_file(self, client, trip):
        itinerary = client.post("/api/plan", json=trip).json()["itinerary"]

        res = client.post("/api/export/ics", json=itinerary)
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("text/calendar")
        assert "rome-2026-09-01.ics" in res.headers["content-disposition"]

    def test_one_calendar_event_per_stop(self, client, trip):
        itinerary = client.post("/api/plan", json=trip).json()["itinerary"]
        res = client.post("/api/export/ics", json=itinerary)
        assert res.text.count("BEGIN:VEVENT") == itinerary["total_activities"]

    def test_empty_itinerary_is_rejected(self, client, trip):
        empty = {
            "trip_request": trip,
            "days": [{"day_number": 1, "date": "2026-09-01", "items": []}],
            "total_cost": 0,
            "total_activities": 0,
            "budget_remaining": trip["budget"],
        }
        res = client.post("/api/export/ics", json=empty)
        assert res.status_code == 400


class TestActivities:
    def test_browses_a_city(self, client):
        res = client.get("/api/activities", params={"city": "Tokyo", "limit": 5})
        assert res.status_code == 200
        assert len(res.json()) <= 5

    def test_unknown_city_returns_nothing(self, client):
        res = client.get("/api/activities", params={"city": "Atlantis"})
        assert res.json() == []
