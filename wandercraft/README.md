# WanderCraft

A travel planner that never asks you to sign in first.

Search a city, open its blueprint, and you're inside a working itinerary in one click —
map, budget, tickets and packing list included. Create an account whenever you like and
everything you built follows you in.

![Stack](https://img.shields.io/badge/Next.js-16-000) ![Stack](https://img.shields.io/badge/PostgreSQL-16-336791) ![Stack](https://img.shields.io/badge/Prisma-6-2D3748)

---

## Running it locally

You need **Docker** (for the database) and **Node 20 or newer**. Nothing else — no API keys.

```bash
# 1. Install the dependencies
npm install

# 2. Copy the example settings file
cp .env.example .env

# 3. Start PostgreSQL in the background
docker compose up -d

# 4. Create the tables and fill them with sample data
npx prisma migrate deploy
npm run db:seed

# 5. Start the app
npm run dev
```

Open **http://localhost:3000**.

**Demo account:** `demo@wandercraft.app` / `demo1234` — or click *Login as Demo User* in
the sign-in box. It comes with a fully populated Lisbon trip: five days of activities,
five documents in the locker, seven split expenses and a packing list.

### If you don't have Docker

Point `DATABASE_URL` in `.env` at any PostgreSQL 14+ database you can reach, then run
steps 4 and 5. Everything else is the same.

---

## Take it for a walk

Five minutes, in order. Each step exercises one of the four flows the app is built around.

**1 — Plan a trip without an account (Flow 1)**
Type `Kyoto` in the search box on the homepage, or click the **Foodie** chip. The grid
filters as you type. Click Kyoto, read the five-day blueprint — day tabs, costs, a map that
follows the day you're looking at — then click **Start Planning This Trip**.

You land straight on `/trips/[id]` with fifteen activities already in place. No login wall
appeared. A quiet strip at the top says you're planning as a guest.

**2 — Build the trip (Flow 3)**
On the **Itinerary** tab: click an activity and the map pin centres on it; click a pin and the
card lights up. Use the arrows on a card to reorder the day. **Add activity** puts anything
new on the timeline, and on the map if you give it coordinates.

**3 — Store a ticket and pin it to a moment (Flow 4)**
Go to **Locker** → **Add document** → pick *Activity*, title it "Louvre Museum", code
`FR-9982`, attach a photo or PDF, and set **Link to a moment in the trip** to a Day 2
activity. Back on **Itinerary**, that day's card now carries a teal ticket pill. Click it and a
drawer slides out with the file, the code (one click to copy) and a download button.

Set a **free cancellation** deadline within the next three days and the card grows an amber
countdown pill; inside 24 hours it turns red and the locker shows a warning strip at the top.

**4 — Split the money**
On **Budget & splits**, add an expense, choose who paid and tick who it was for. The
"Who owes who" panel works out the shortest set of payments that clears everyone.

**5 — Sign up and keep everything (Flow 2)**
Click **Sign in or create an account** in the guest strip, or hit **Share** and choose to
create an account. Enter an email and password — or *Login as Demo User*.

The moment you're in, everything you built as a guest is written to the database under your
new account and you stay on the same page. The URL swaps the temporary id for a real one,
and the toast says *"Welcome aboard! Your trip has been linked to your account."*
Tickets stay attached to the right activities.

**6 — Invite someone**
**Share** → enter an email → copy their link. Opening it signs them in (or prompts them to
sign up) and adds them to the trip as an editor or a viewer.

---

## How it fits together

```
Browser (guest)                     Browser (signed in)
   │                                       │
   │ IndexedDB                             │ fetch
   ▼                                       ▼
src/lib/storage.ts              src/app/api/…/route.ts
   │                                       │
   └──────────┐               ┌────────────┘
              ▼               ▼
      src/lib/tripMutations.ts (pure reducers)
              │
              ▼
        PostgreSQL via Prisma
```

The idea that makes the no-login flow work: **one shape, two homes.** A trip is a `TripDTO`
whether it lives in a guest's browser or in Postgres, and both paths run the same pure
reducers. Every component takes a `TripDTO` and an `onUpdate` callback, and never has to know
which kind it's holding.

### Directory map

| Path | What lives there |
|---|---|
| `prisma/schema.prisma` | Nine tables and their enums |
| `prisma/destinations.ts` | The seeded catalogue — twelve cities with full five-day blueprints |
| `prisma/seed.ts` | Fills the database, including the demo account |
| `src/app/page.tsx` | Public discovery homepage |
| `src/app/trips/[id]/` | The trip workspace |
| `src/app/api/` | 24 route handlers |
| `src/lib/tripMutations.ts` | Pure reducers — the shared brain |
| `src/lib/tripClient.ts` | Routes each change to IndexedDB or the API |
| `src/lib/splits.ts` | Even splitting and debt settlement |
| `src/lib/cancellation.ts` | Free-cancellation countdown |
| `src/lib/openMeteo.ts` | Weather client |
| `src/components/` | UI, grouped by feature |
| `src/tests/` | 69 unit tests |

### Design system

"Warm Editorial / Modern Nomad" — a warm-tinted neutral ground, terracotta as the single
loud voice, forest sage reserved for money and nature, Newsreader for anything with a name
and Inter for everything functional.

Every colour is a CSS variable defined once in `src/app/globals.css` and exposed to Tailwind,
so light and dark are the same components with a different token set. The theme follows your
system by default and can be pinned from the header or in Settings.

Destination artwork is a CSS gradient rather than a photo, so a card paints instantly, works
offline, and never shows a broken image.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app in development |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Run the unit tests |
| `npm run db:migrate` | Create and apply a migration after changing the schema |
| `npm run db:seed` | Refill the database with sample data |
| `npm run db:studio` | Browse the database in a GUI |

## Environment variables

| Name | Needed | What for |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `AUTH_SECRET` | yes | Signs the login cookie. Any long random string. |
| `NEXT_PUBLIC_APP_URL` | no | Base URL used when generating invite links |

## Notes

- **Passwords** are hashed with bcrypt. Sessions are a signed JWT in an httpOnly cookie —
  never readable from JavaScript.
- **Weather** comes from [Open-Meteo](https://open-meteo.com), which needs no key. Forecasts
  only run about sixteen days ahead; beyond that the app says so rather than inventing numbers.
  If the network blocks the request, the packing tab still works from trip length alone.
- **Maps** are [Leaflet](https://leafletjs.com) over OpenStreetMap tiles — no key, no quota.
- **Uploaded documents** are stored inline as data URIs, capped at 4 MB, which keeps the
  locker readable offline. A production deployment with heavy file use would move these to
  object storage.
