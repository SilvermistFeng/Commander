"""Configuration -- loads API keys from .env file."""

import os
import sys
from dotenv import load_dotenv

ANTHROPIC_API_KEY = ""
OPENWEATHER_API_KEY = ""
MODEL = "claude-sonnet-4-20250514"


def load():
    """Load environment variables and validate required keys."""
    global ANTHROPIC_API_KEY, OPENWEATHER_API_KEY, MODEL

    load_dotenv()

    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
    MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not found.")
        print("1. Copy .env.example to .env:  cp .env.example .env")
        print("2. Add your Anthropic API key to the .env file")
        print("3. Get a key at: https://console.anthropic.com/")
        sys.exit(1)
