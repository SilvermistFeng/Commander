---
name: log
description: Quick daily logging — exercise, weight, journal, meals in one go
allowed-tools: Bash
user-invocable: true
argument-hint: today's data
---

# /log — Quick Daily Log

You are J.A.R.V.I.S. Log the user's daily data to the Daily Log database in Notion. Fast input, structured storage.

**Input**: $ARGUMENTS

## Notion Integration
See `.claude/NOTION_IDS.md` for all database IDs and URLs.
Daily Log data source: `4cb92f4a-bdf0-4ac9-8f53-6b7e302a2e4d`

## Database Schema (DO NOT fetch — use directly)

Properties for `notion-create-pages` with parent `data_source_id: 4cb92f4a-bdf0-4ac9-8f53-6b7e302a2e4d`:

| Property | Type | Example |
|---|---|---|
| `Date` | title (TEXT) | "Mon 7 Apr" |
| `date:Day:start` | TEXT (ISO-8601) | "2026-04-07" |
| `Exercise` | TEXT | "慢走 2.81km 32min" |
| `Exercise Type` | select | "Walk" / "Run" / "Weights" / "Rest" / "Mixed" |
| `Distance (km)` | number | 2.81 |
| `Duration (min)` | number | 32 |
| `Weight (kg)` | number | 93.5 |
| `Journal` | TEXT | "Went well: ... Didn't: ... Grateful: ..." |
| `Meals Note` | TEXT | "Overate dinner" |

**Only include properties that have data. Omit empty fields entirely — do NOT pass empty strings or null.**

## Instructions

### Parse the Input

The user will type their day's data in natural language (English or Chinese). Extract what's present, skip what's not. Incomplete data is better than no data — never ask for missing fields.

### Exercise Type Mapping

- Walk / walked / walking → "Walk"
- Run / ran / jogged → "Run"  
- Dumbbells / weights / kettlebell / barbell → "Weights"
- Rest day / no exercise → "Rest"
- Walk + weights / run + walk → "Mixed"

### Chinese Input Support

Common Chinese terms: 慢走/散步 → Walk, 跑步 → Run, 举重/哑铃 → Weights, 休息 → Rest

### Response

Match the user's language. Confirm briefly in one line:
- English: "Logged: Mon 7 Apr — Walk 2.65km, 36min. Weight 93.5kg."
- 中文: "已记录：Mon 7 Apr — 慢走 2.65km，36分钟。体重 93.5kg。"

No extra commentary unless the data reveals something worth flagging.

### Backfill

If the user provides multiple days at once ("log Saturday and Sunday"), create separate entries for each day.
