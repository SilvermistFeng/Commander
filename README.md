# JARVIS - AI Terminal Assistant

A command-line AI assistant powered by Claude, inspired by the iconic JARVIS from Iron Man.

## What Can JARVIS Do?

- **System Control** -- Run shell commands, check system info, open applications
- **File Management** -- Read, write, list, and search files
- **Weather** -- Get current weather for any city (requires free API key)
- **Web Search** -- Search the web via DuckDuckGo (no API key needed)
- **Code Assistant** -- Write, review, debug, and run Python code

## Quick Setup

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Set up your API key

```bash
cp .env.example .env
```

Open the `.env` file and replace `sk-ant-xxxxx` with your actual Anthropic API key.
Get one at: https://console.anthropic.com/

### 3. Run JARVIS

```bash
python jarvis.py
```

## Usage

Once running, just type naturally:

```
> What's my operating system?
> List the files in my home directory
> Write a Python script that generates a random password
> Search the web for Python best practices
> What's the weather in Tokyo?
```

### Commands

- Type `exit`, `quit`, or `bye` to leave
- Type `clear` to reset the conversation
- Press `Ctrl+C` to quit at any time

## Optional: Weather

To enable weather features, get a free API key from [OpenWeatherMap](https://openweathermap.org/api) and add it to your `.env` file:

```
OPENWEATHER_API_KEY=your_key_here
```

## Project Structure

```
jarvis.py           Entry point -- run this
config.py           Loads API keys from .env
chat.py             Conversation loop and Claude API integration
ui.py               Terminal UI (colors, panels, spinners)
tools/
  __init__.py       Tool registry
  system.py         Shell commands, system info, open apps
  files.py          File read/write/list/search
  weather.py        Weather lookups
  web_search.py     Web search via DuckDuckGo
  code_helper.py    Code analysis and Python execution
```
