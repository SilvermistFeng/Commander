"""Calendar export — turn an itinerary into a .ics file.

A plan you can only read in a browser tab isn't much use once
you're actually standing in Rome. This converts an itinerary
into the standard calendar format (.ics) that Google Calendar,
Apple Calendar and Outlook all understand, so every stop turns
into a real appointment on the traveller's phone.

Times are written as "floating" local times — no timezone —
which is exactly right for travel: 09:00 means nine in the
morning where you are, not nine back home.
"""

from datetime import datetime, timezone

from travel.models.trip import Itinerary

PRODUCT_ID = "-//TripOptimiser//Travel Itinerary//EN"
MAX_LINE_OCTETS = 75

TYPE_LABELS = {
    "attraction": "Sightseeing",
    "restaurant": "Meal",
    "cafe": "Coffee stop",
    "shopping": "Shopping",
    "entertainment": "Entertainment",
    "transport": "Travel",
}


def _escape(text: str) -> str:
    """Escape the characters the calendar format treats specially."""
    return (
        text.replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _fold(line: str) -> list[str]:
    """Split long lines the way the calendar format requires.

    Calendar files cap lines at 75 bytes; longer ones continue
    on the next line starting with a space. We measure in bytes,
    not characters, so accented place names don't break it.
    """
    encoded = line.encode("utf-8")
    if len(encoded) <= MAX_LINE_OCTETS:
        return [line]

    parts: list[str] = []
    current = ""
    current_len = 0

    for char in line:
        size = len(char.encode("utf-8"))
        if current_len + size > MAX_LINE_OCTETS:
            parts.append(current)
            current = " " + char
            current_len = 1 + size
        else:
            current += char
            current_len += size

    if current:
        parts.append(current)

    return parts


def _stamp(moment: datetime) -> str:
    """Format a UTC timestamp for the DTSTAMP field."""
    return moment.astimezone(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def itinerary_to_ics(
    itinerary: Itinerary, generated_at: datetime | None = None
) -> str:
    """Convert an itinerary into calendar (.ics) text.

    Every scheduled stop becomes one calendar event, with the
    place name as the title, its address as the location, and
    the rating and estimated cost in the notes.
    """
    stamp = _stamp(generated_at or datetime.now(timezone.utc))
    request = itinerary.trip_request
    destination = request.city
    if request.country:
        destination = f"{destination}, {request.country}"

    lines: list[str] = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        f"PRODID:{PRODUCT_ID}",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{_escape(f'Trip to {destination}')}",
    ]

    for day in itinerary.days:
        day_stamp = day.date.strftime("%Y%m%d")

        for index, item in enumerate(day.items, start=1):
            activity = item.activity
            label = TYPE_LABELS.get(activity.activity_type.value, "Activity")

            notes = [
                f"{label} — day {day.day_number} of your trip to {destination}.",
                f"Rating: {activity.review_score:.1f}/5"
                f" ({activity.review_count:,} reviews)",
                f"Estimated cost: {request.currency} "
                f"{activity.estimated_cost:.0f}",
            ]
            if item.travel_minutes_from_previous:
                notes.append(
                    f"About {item.travel_minutes_from_previous} min travel "
                    "from the previous stop."
                )
            if activity.description:
                notes.append(activity.description)

            lines.extend(
                [
                    "BEGIN:VEVENT",
                    f"UID:{activity.id}-day{day.day_number}-{index}@tripoptimiser",
                    f"DTSTAMP:{stamp}",
                    f"DTSTART:{day_stamp}T{item.start_time.strftime('%H%M%S')}",
                    f"DTEND:{day_stamp}T{item.end_time.strftime('%H%M%S')}",
                    f"SUMMARY:{_escape(activity.name)}",
                    f"LOCATION:{_escape(activity.address or destination)}",
                    f"DESCRIPTION:{_escape(' '.join(notes))}",
                    f"CATEGORIES:{_escape(label)}",
                    f"GEO:{activity.latitude:.6f};{activity.longitude:.6f}",
                    "END:VEVENT",
                ]
            )

    lines.append("END:VCALENDAR")

    folded: list[str] = []
    for line in lines:
        folded.extend(_fold(line))

    # Calendar files use carriage-return line endings, and end with one
    return "\r\n".join(folded) + "\r\n"


def ics_filename(itinerary: Itinerary) -> str:
    """A sensible download filename, e.g. 'rome-2026-09-01.ics'."""
    city = itinerary.trip_request.city.lower().replace(" ", "-")
    safe_city = "".join(c for c in city if c.isalnum() or c == "-") or "trip"
    return f"{safe_city}-{itinerary.trip_request.start_date.isoformat()}.ics"
