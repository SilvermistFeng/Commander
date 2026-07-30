"""Turning human date phrases into real calendar dates.

People write dates every which way: "yesterday", "on 2026-08-20",
"3 days ago", "Aug 20 2026". This module boils all of that down to a single
``datetime.date``.

Crucially, relative phrases ("yesterday") are resolved against a *reference
date* that the caller supplies — never against the real wall clock inside
here. That makes parsing deterministic and testable: the same sentence with
the same reference date always yields the same result.
"""

from __future__ import annotations

import re
from datetime import date, timedelta

# Month names (and common abbreviations) → month number.
_MONTHS = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

# Weekday names → Python's Monday=0 … Sunday=6 numbering.
_WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6,
}

_ISO_RE = re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b")
_SLASH_RE = re.compile(r"\b(\d{1,2})/(\d{1,2})/(\d{2,4})\b")
_DAYS_AGO_RE = re.compile(r"\b(\d+)\s+days?\s+ago\b")
_WEEKS_AGO_RE = re.compile(r"\b(\d+)\s+weeks?\s+ago\b")
_MONTH_NAME_RE = re.compile(
    r"\b(" + "|".join(_MONTHS) + r")\.?\s+(\d{1,2})(?:st|nd|rd|th)?"
    r"(?:,?\s+(\d{4}))?\b",
    re.IGNORECASE,
)
_WEEKDAY_RE = re.compile(
    r"\blast\s+(" + "|".join(_WEEKDAYS) + r")\b", re.IGNORECASE
)


def parse_date(text: str, reference: date) -> date:
    """Find a date inside ``text`` and resolve it against ``reference``.

    Tries the unambiguous formats first (ISO ``YYYY-MM-DD``), then relative
    phrases, then natural month-name dates. If nothing is found, falls back
    to the reference date itself — the sensible default for "I just did this".

    Args:
        text: The sentence (or fragment) to search.
        reference: The date that "today"/"yesterday" are measured from.

    Returns:
        A concrete ``datetime.date``.
    """
    lowered = text.lower()

    # 1. Explicit ISO date — the least ambiguous, so it wins.
    iso = _ISO_RE.search(text)
    if iso:
        year, month, day = (int(g) for g in iso.groups())
        return date(year, month, day)

    # 2. Named relative phrases.
    if "day before yesterday" in lowered:
        return reference - timedelta(days=2)
    if "yesterday" in lowered:
        return reference - timedelta(days=1)
    if "tomorrow" in lowered:
        return reference + timedelta(days=1)
    if "today" in lowered or "just now" in lowered:
        return reference

    # 3. "N days/weeks ago".
    m = _DAYS_AGO_RE.search(lowered)
    if m:
        return reference - timedelta(days=int(m.group(1)))
    m = _WEEKS_AGO_RE.search(lowered)
    if m:
        return reference - timedelta(weeks=int(m.group(1)))

    # 4. "last Friday" and friends.
    m = _WEEKDAY_RE.search(lowered)
    if m:
        return _last_weekday(reference, _WEEKDAYS[m.group(1).lower()])

    # 5. Slash date. Assume day/month/year is uncommon in this data; use the
    #    US month/day/year convention that dominates brokerage statements.
    m = _SLASH_RE.search(text)
    if m:
        month, day, year = (int(g) for g in m.groups())
        if year < 100:
            year += 2000
        return date(year, month, day)

    # 6. Natural "Aug 20 2026" / "August 20".
    m = _MONTH_NAME_RE.search(text)
    if m:
        month = _MONTHS[m.group(1).lower()]
        day = int(m.group(2))
        year = int(m.group(3)) if m.group(3) else reference.year
        return date(year, month, day)

    # 7. Nothing matched — default to the reference date.
    return reference


def find_expiry(text: str, reference: date) -> date | None:
    """Pull an explicit expiry/maturity date out of an option or bond phrase.

    Unlike :func:`parse_date`, this returns ``None`` when no explicit date is
    present — an option with no stated expiry should not silently inherit
    "today". Only ISO and natural month-name dates count as an expiry.
    """
    iso = _ISO_RE.search(text)
    if iso:
        year, month, day = (int(g) for g in iso.groups())
        return date(year, month, day)

    m = _MONTH_NAME_RE.search(text)
    if m:
        month = _MONTHS[m.group(1).lower()]
        day = int(m.group(2))
        year = int(m.group(3)) if m.group(3) else reference.year
        return date(year, month, day)

    return None


def _last_weekday(reference: date, target_weekday: int) -> date:
    """The most recent past occurrence of a weekday, before ``reference``."""
    days_back = (reference.weekday() - target_weekday) % 7
    if days_back == 0:
        days_back = 7  # "last Monday" on a Monday means a week ago, not today.
    return reference - timedelta(days=days_back)
