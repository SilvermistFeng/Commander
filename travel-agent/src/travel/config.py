"""Configuration — all settings live here.

API keys, default values, and tunable parameters.
Never hardcode these in other files.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, loaded from environment variables or .env file."""

    # Google APIs
    google_places_api_key: str = ""
    google_maps_api_key: str = ""

    # Affiliate APIs (Phase 2 — flights and hotels)
    skyscanner_api_key: str = ""
    booking_affiliate_id: str = ""

    # App defaults
    # Upper safety limit — in practice the trip's pace decides how many
    # stops a day gets (see scheduler.PACE_PROFILES).
    max_activities_per_day: int = 8
    default_currency: str = "USD"
    min_review_score: float = 3.5  # Minimum rating to include (out of 5)
    max_travel_minutes_between_stops: int = 45  # Skip places too far apart

    # Optimiser settings
    max_optimisation_seconds: int = 10  # Time limit for the solver

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
