"""Weather tool -- current weather via OpenWeatherMap API."""

import requests


def get_weather(city: str) -> str:
    """Get the current weather for a city using OpenWeatherMap."""
    import config

    if not config.OPENWEATHER_API_KEY:
        return (
            "Weather features require an OpenWeatherMap API key.\n"
            "1. Get a free key at: https://openweathermap.org/api\n"
            "2. Add it to your .env file: OPENWEATHER_API_KEY=your_key_here"
        )

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": config.OPENWEATHER_API_KEY,
            "units": "metric",
        }
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        weather = data["weather"][0]["description"].capitalize()
        temp = data["main"]["temp"]
        feels_like = data["main"]["feels_like"]
        humidity = data["main"]["humidity"]
        wind = data["wind"]["speed"]
        name = data["name"]
        country = data["sys"]["country"]

        return (
            f"Weather in {name}, {country}:\n"
            f"  Conditions: {weather}\n"
            f"  Temperature: {temp}°C (feels like {feels_like}°C)\n"
            f"  Humidity: {humidity}%\n"
            f"  Wind: {wind} m/s"
        )
    except requests.HTTPError as e:
        if e.response.status_code == 404:
            return f"City '{city}' not found. Check the spelling and try again."
        return f"Weather API error: {e}"
    except Exception as e:
        return f"Error fetching weather: {e}"


TOOLS = [
    (
        {
            "name": "get_weather",
            "description": "Get the current weather for a city. Returns temperature, conditions, humidity, and wind speed.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "City name (e.g., 'London', 'New York', 'Tokyo')",
                    }
                },
                "required": ["city"],
            },
        },
        get_weather,
    ),
]
