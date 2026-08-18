# TripOptimiser — Travel Itinerary Builder

Tell it where you're going, when, and how much you want to spend.
It gives you back a proper day-by-day, hour-by-hour plan — not just
a list of places, but a schedule you can actually follow, with meals
at mealtimes and travel time between stops accounted for.

## What it does

- **Picks the right places.** Ranks everything by review score *and*
  review count, so a 4.5 with 2,000 reviews beats a 5.0 with three.
- **Schedules them properly.** Every stop gets a start and end time.
  Lunch lands around midday, dinner in the evening, and the walk
  between stops is built into the clock.
- **Keeps your must-sees.** Name the places you refuse to miss and
  they're locked into the plan — even if they're not the highest rated.
- **Matches your pace.** Relaxed (later start, 4 stops), Balanced
  (9am, 6 stops) or Packed (early start, 8 stops).
- **Stays in budget.** Won't plan a trip you can't afford.
- **Re-plans instantly.** Remove something you don't fancy and the
  rest of the trip rearranges around the gap.
- **Comes with you.** Export the whole trip to your calendar, or print
  it as a clean one-page-per-day PDF.

## How it decides

Three stages, in order:

1. **Which places, on which days** — a constraint solver (Google's
   OR-Tools) picks the combination with the highest total quality
   inside your budget, your daily time limit, and the variety rules.
   If your constraints are too tight to solve, it falls back to a
   simpler "best first" approach rather than giving you nothing.
2. **What order to visit them** — checks every possible ordering of
   the day's stops and picks the one with the least travel.
3. **What time to be where** — walks the clock forward through the
   day, slotting meals into meal windows and adding travel time
   between stops.

## Running it

### Backend

```bash
cd travel-agent
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"
.venv/bin/uvicorn travel.api.app:app --reload
```

The API is then at `http://localhost:8000`, with interactive docs at
`http://localhost:8000/docs`.

### Frontend

```bash
cd travel-agent/frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Demo mode

Without a Google Places API key the app runs on built-in data for
nine cities — Rome, Tokyo, Paris, Xi'an, London, Barcelona, Bangkok,
New York and Istanbul. The city picker in the form shows you which
ones are available.

To plan for anywhere in the world, add a key:

```bash
cp .env.example .env   # then fill in GOOGLE_PLACES_API_KEY
```

## Tests

```bash
.venv/bin/python -m pytest    # backend
cd frontend && npm run build  # frontend typecheck + build
```

## The endpoints

| Endpoint | What it does |
|---|---|
| `POST /api/plan` | City, dates, budget → a timed itinerary |
| `POST /api/replan` | Add or remove places → a rebuilt itinerary |
| `GET /api/activities` | Browse what's available in a city |
| `GET /api/cities` | Which cities can be planned right now |
| `POST /api/export/ics` | The itinerary as a calendar file |
| `GET /health` | Is it running, and on live or demo data |

## Layout

```
src/travel/
  models/trip.py          What a trip, day, and activity look like
  core/optimiser.py       Which places, on which days
  core/scheduler.py       What time to be where
  core/geo.py             Distances and visit ordering
  core/calendar.py        Calendar (.ics) export
  api/routes.py           The endpoints
  services/reviews/       Where ratings come from (Google, or demo data)
frontend/src/
  components/TripForm     The planning form
  components/ItineraryView  The day-by-day timeline
  lib/api.ts              Everything that talks to the backend
```

## What's not built yet

- Real travel times (currently estimated from straight-line distance
  at typical city speed).
- Opening hours aren't enforced — a museum could be scheduled while
  it's shut.
- No saved trips: refresh the page and the plan is gone.
- Flights and hotels.
