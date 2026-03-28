# J.A.R.V.I.S. — Just A Rather Very Intelligent System

A hyper-intelligent AI terminal assistant powered by Claude Code, modelled after the iconic AI from the Iron Man universe. No API key required — runs on your Claude Pro subscription.

## Quick Start

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Claude Pro subscription (any tier)

### Activate JARVIS

```bash
cd Commander
claude
```

That's it. JARVIS activates automatically when Claude Code opens this directory.

## Commands

| Command | What it does |
|---|---|
| `/status` | Full system status briefing — OS, uptime, disk, memory, CPU |
| `/weather <city>` | Current weather for any city |
| `/review <file>` | Thorough code review with security, performance, and quality analysis |
| `/brief` | Morning briefing — system status, git state, recent activity |

You can also just talk naturally — JARVIS handles any request Claude Code can:

```
> What's my disk usage looking like?
> Write a Python script that sorts a CSV file
> Explain how this codebase works
> Search the web for the latest Node.js LTS version
```

## Optional: Weather API

For precise weather data, get a free API key from [OpenWeatherMap](https://openweathermap.org/api):

```bash
cp .env.example .env
# Edit .env and add your OPENWEATHER_API_KEY
```

Without an API key, `/weather` falls back to web search results.

## Project Structure

```
CLAUDE.md                          JARVIS persona (loaded automatically)
.claude/
  settings.json                    Project permissions
  skills/
    status/SKILL.md                /status command
    weather/SKILL.md               /weather command
    weather/fetch_weather.py       Weather API helper
    review/SKILL.md                /review command
    brief/SKILL.md                 /brief command
.env.example                       API key template (optional)
requirements.txt                   Python deps for weather helper
legacy/                            Standalone Python chatbot (requires API key)
```

## Legacy Standalone App

The `legacy/` directory contains a standalone Python chatbot version of JARVIS that uses the Anthropic API directly. It requires an `ANTHROPIC_API_KEY` (billed per-token, not covered by Pro).

```bash
cd legacy
pip install -r ../requirements.txt
cp ../.env.example ../.env  # add ANTHROPIC_API_KEY
python jarvis.py
```
