"""Tests for the calendar (.ics) export.

Calendar files are picky about their format, so these check the
structure as well as the content: one event per stop, correct
times, escaped text, and no line longer than the spec allows.
"""

from datetime import date, datetime, time, timezone

from travel.core.calendar import (
    MAX_LINE_OCTETS,
    _escape,
    _fold,
    ics_filename,
    itinerary_to_ics,
)
from travel.models.trip import (
    Activity,
    ActivityType,
    DayPlan,
    Itinerary,
    ScheduleItem,
    TripRequest,
)

FIXED_TIME = datetime(2026, 8, 18, 12, 0, tzinfo=timezone.utc)


def _itinerary() -> Itinerary:
    colosseum = Activity(
        id="rome-1",
        name="Colosseum, the big one",
        activity_type=ActivityType.ATTRACTION,
        latitude=41.8902,
        longitude=12.4922,
        review_score=4.7,
        review_count=189432,
        estimated_cost=16,
        estimated_minutes=120,
        address="Piazza del Colosseo; Rome",
    )
    dinner = Activity(
        id="rome-9",
        name="Da Enzo al 29",
        activity_type=ActivityType.RESTAURANT,
        latitude=41.8870,
        longitude=12.4720,
        review_score=4.5,
        review_count=8923,
        estimated_cost=25,
        estimated_minutes=75,
        address="Via dei Vascellari 29, Rome",
    )

    request = TripRequest(
        city="Rome",
        country="Italy",
        start_date=date(2026, 9, 1),
        end_date=date(2026, 9, 3),
        budget=400,
        currency="EUR",
    )

    day = DayPlan(
        day_number=1,
        date=date(2026, 9, 1),
        items=[
            ScheduleItem(
                activity=colosseum,
                start_time=time(9, 0),
                end_time=time(11, 0),
            ),
            ScheduleItem(
                activity=dinner,
                start_time=time(18, 30),
                end_time=time(19, 45),
                travel_minutes_from_previous=12,
            ),
        ],
        total_cost=41.0,
        total_travel_minutes=12,
    )

    return Itinerary(
        trip_request=request,
        days=[day, DayPlan(day_number=2, date=date(2026, 9, 2))],
        total_cost=41.0,
        total_activities=2,
        budget_remaining=359.0,
    )


class TestEscaping:
    def test_special_characters_are_escaped(self):
        assert _escape("a;b") == "a\\;b"
        assert _escape("a,b") == "a\\,b"
        assert _escape("a\\b") == "a\\\\b"
        assert _escape("line1\nline2") == "line1\\nline2"


class TestFolding:
    def test_short_lines_are_left_alone(self):
        assert _fold("SUMMARY:Colosseum") == ["SUMMARY:Colosseum"]

    def test_long_lines_are_split_with_a_leading_space(self):
        parts = _fold("DESCRIPTION:" + "x" * 200)
        assert len(parts) > 1
        assert all(len(p.encode("utf-8")) <= MAX_LINE_OCTETS for p in parts)
        assert all(p.startswith(" ") for p in parts[1:])

    def test_accented_names_stay_within_the_byte_limit(self):
        parts = _fold("SUMMARY:" + "Sant'Eustachio Il Caffè " * 10)
        assert all(len(p.encode("utf-8")) <= MAX_LINE_OCTETS for p in parts)


class TestIcsExport:
    def test_wraps_in_a_calendar_block(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        assert ics.startswith("BEGIN:VCALENDAR")
        assert ics.rstrip().endswith("END:VCALENDAR")

    def test_one_event_per_scheduled_stop(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        assert ics.count("BEGIN:VEVENT") == 2
        assert ics.count("END:VEVENT") == 2

    def test_times_match_the_schedule(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        assert "DTSTART:20260901T090000" in ics
        assert "DTEND:20260901T110000" in ics
        assert "DTSTART:20260901T183000" in ics

    def test_place_names_and_addresses_are_escaped(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        assert "SUMMARY:Colosseum\\, the big one" in ics
        assert "LOCATION:Piazza del Colosseo\\; Rome" in ics

    def test_uses_carriage_return_line_endings(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        assert "\r\n" in ics
        assert "\n" not in ics.replace("\r\n", "")

    def test_no_line_exceeds_the_limit(self):
        ics = itinerary_to_ics(_itinerary(), FIXED_TIME)
        for line in ics.split("\r\n"):
            assert len(line.encode("utf-8")) <= MAX_LINE_OCTETS

    def test_empty_days_produce_no_events(self):
        itinerary = _itinerary()
        itinerary.days = [DayPlan(day_number=1, date=date(2026, 9, 1))]
        ics = itinerary_to_ics(itinerary, FIXED_TIME)
        assert "BEGIN:VEVENT" not in ics


class TestFilename:
    def test_filename_uses_city_and_start_date(self):
        assert ics_filename(_itinerary()) == "rome-2026-09-01.ics"

    def test_awkward_city_names_are_cleaned_up(self):
        itinerary = _itinerary()
        itinerary.trip_request.city = "Xi'an / Shaanxi"
        assert ics_filename(itinerary) == "xian--shaanxi-2026-09-01.ics"
