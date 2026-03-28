"""Fetch current weather from OpenWeatherMap. Used by the /weather skill."""

import json
import sys
import os

try:
    from dotenv import load_dotenv
    import requests
except ImportError:
    print("Dependencies missing. Run: pip install python-dotenv requests")
    sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python fetch_weather.py <city>")
        sys.exit(1)

    city = " ".join(sys.argv[1:])
    load_dotenv()
    api_key = os.getenv("OPENWEATHER_API_KEY", "")

    if not api_key:
        print("NO_API_KEY")
        sys.exit(0)

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"q": city, "appid": api_key, "units": "metric"}
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        result = {
            "city": data["name"],
            "country": data["sys"]["country"],
            "conditions": data["weather"][0]["description"].capitalize(),
            "temp_c": data["main"]["temp"],
            "feels_like_c": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "wind_ms": data["wind"]["speed"],
        }
        print(json.dumps(result, indent=2))

    except requests.HTTPError as e:
        if e.response.status_code == 404:
            print(f"CITY_NOT_FOUND: {city}")
        else:
            print(f"API_ERROR: {e}")
    except Exception as e:
        print(f"ERROR: {e}")


if __name__ == "__main__":
    main()
