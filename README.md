# J.A.R.V.I.S. — Just A Rather Very Intelligent System

Your personal AI chief of staff, powered by Claude Code. Manages your initiatives, sharpens your priorities, anticipates your needs, and provides strategic counsel — all from the terminal.

No API key required. Runs on your Claude Pro subscription.

## Quick Start

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed
- Claude Pro subscription (any tier)

### Activate JARVIS

```bash
cd Commander
claude
```

JARVIS activates automatically when Claude Code opens this directory.

## Core Commands

### Personal Assistant

| Command | What it does |
|---|---|
| `/brief` | Morning briefing — priorities, deadlines, and what needs attention today |
| `/plan` | Structure your day or week around what matters most |
| `/initiative <action>` | Manage initiatives: add, update, list, prioritize, complete, drop |
| `/think <topic>` | Strategic thinking and decision support on any topic |
| `/recap` | End-of-day summary — accomplishments, shifts, and tomorrow's focus |
| `/research <topic>` | Deep research from reputable sources with synthesis and recommendations |
| `/remember <what>` | Store knowledge in the Brain or recall past learnings |
| `/monitor [topic]` | Intelligence sweep — research latest developments for your initiatives |
| `/improve [target]` | Self-audit and improve JARVIS's own skills and configuration |

### Utilities

| Command | What it does |
|---|---|
| `/status` | System status briefing — OS, uptime, disk, memory, CPU |
| `/weather <city>` | Current weather for any city |
| `/review <file>` | Code review with security, performance, and quality analysis |

### Natural Conversation

Just talk to JARVIS — no command needed:

```
> I'm thinking about starting a new project to learn Rust
> What should I focus on this week?
> Help me think through whether to accept this job offer
> What's the status of my initiatives?
```

## Initiative Management

JARVIS tracks your projects and goals in **Notion** — no local files on your machine. Data lives in the **J.A.R.V.I.S. Command Centre** workspace with three databases:

- **Initiatives** — Your active projects with priority (P0-P3), status, deadlines, and next actions
- **Goals** — High-level goals that initiatives ladder up to
- **Decisions** — Log of significant decisions with context and rationale
- **JARVIS Brain** — Persistent knowledge base: insights, research findings, preferences, patterns, and lessons learned. JARVIS gets smarter over time by referencing past knowledge before researching.

The Initiatives database includes a Board view (grouped by status) and a Table view (sorted by priority).

### Example Workflow

```
> /initiative add Build JARVIS AI
> /plan
> /brief                    # start of day
> /recap                    # end of day
> /think Should I pivot from Python to Rust for this project?
```

## Optional: Weather API

For precise weather data, add a free [OpenWeatherMap](https://openweathermap.org/api) key:

```bash
cp .env.example .env
# Edit .env and add your OPENWEATHER_API_KEY
```

Without an API key, `/weather` uses web search results.

## Project Structure

```
CLAUDE.md                              JARVIS persona & instructions
.claude/
  settings.json                        Project permissions
  skills/
    brief/SKILL.md                     /brief — morning briefing
    plan/SKILL.md                      /plan — daily/weekly planning
    initiative/SKILL.md                /initiative — manage initiatives
    think/SKILL.md                     /think — strategic thinking
    recap/SKILL.md                     /recap — end-of-day summary
    status/SKILL.md                    /status — system status
    weather/SKILL.md                   /weather — weather lookup
    weather/fetch_weather.py           Weather API helper
    review/SKILL.md                    /review — code review
legacy/                                Standalone Python chatbot (requires API key)
```

Data is stored in Notion (J.A.R.V.I.S. Command Centre) — nothing personal on your local machine.
