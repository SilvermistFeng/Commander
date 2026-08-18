"""Distance and routing helpers.

Two jobs live here:

1. Estimating how long it takes to get from one place to another.
2. Working out the best order to visit a set of places so you
   spend as little of your day as possible in transit.

Both the optimiser (which decides *what* you do) and the
scheduler (which decides *when* you do it) need these, so they
live in their own file to keep the two apart.
"""

import itertools
import math

from travel.models.trip import Activity

# Rough city speed: 15 km/h average (walking + transit + waiting)
CITY_SPEED_KMH = 15

# Above this many stops, checking every possible order gets slow,
# so we use a good-enough shortcut instead.
BRUTE_FORCE_LIMIT = 8


def calculate_travel_minutes(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> int:
    """Estimate travel time between two points (rough city estimate).

    Uses straight-line distance with a city travel factor.
    For MVP, this is good enough. Phase 2 will use Google
    Directions API for actual travel times.
    """
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    km = 6371 * 2 * math.asin(math.sqrt(a))

    return max(5, int((km / CITY_SPEED_KMH) * 60))


def travel_between(first: Activity, second: Activity) -> int:
    """Travel time between two activities, in minutes."""
    return calculate_travel_minutes(
        first.latitude, first.longitude, second.latitude, second.longitude
    )


def optimal_order(activities: list[Activity]) -> tuple[list[Activity], int]:
    """Find the visit order that minimises total travel time.

    With a handful of stops, checking every possible order
    (8 stops = 40,320 orders) is still fast. Beyond that we
    fall back to a nearest-neighbour shortcut.
    """
    if len(activities) <= 1:
        return list(activities), 0

    if len(activities) > BRUTE_FORCE_LIMIT:
        return nearest_neighbour_order(activities)

    best_order = list(activities)
    best_travel = float("inf")

    for perm in itertools.permutations(range(len(activities))):
        travel = sum(
            travel_between(activities[perm[i]], activities[perm[i + 1]])
            for i in range(len(perm) - 1)
        )
        if travel < best_travel:
            best_travel = travel
            best_order = [activities[p] for p in perm]

    return best_order, int(best_travel)


def nearest_neighbour_order(
    activities: list[Activity],
) -> tuple[list[Activity], int]:
    """Nearest-neighbour heuristic for ordering — fallback for large days.

    Start at the first stop, then always hop to whichever
    remaining stop is closest. Not perfect, but instant.
    """
    remaining = list(range(len(activities)))
    order = [remaining.pop(0)]
    total_travel = 0

    while remaining:
        last = order[-1]
        best_next = min(
            remaining,
            key=lambda j: travel_between(activities[last], activities[j]),
        )
        total_travel += travel_between(activities[last], activities[best_next])
        order.append(best_next)
        remaining.remove(best_next)

    return [activities[i] for i in order], total_travel
