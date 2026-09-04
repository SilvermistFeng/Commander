/**
 * Open-Meteo client. Free, no API key, no attribution requirement.
 *
 * Forecasts only run about 16 days ahead, so for a trip further out than that
 * we say so plainly rather than inventing numbers.
 */

export type DailyForecast = {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  windMax: number;
};

export type ForecastResult = {
  available: boolean;
  reason?: string;
  days: DailyForecast[];
  summary?: {
    avgHigh: number;
    avgLow: number;
    rainiestChance: number;
    maxWind: number;
  };
};

const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "sun" },
  1: { label: "Mainly clear", icon: "sun" },
  2: { label: "Partly cloudy", icon: "cloud-sun" },
  3: { label: "Overcast", icon: "cloud" },
  45: { label: "Fog", icon: "cloud-fog" },
  48: { label: "Freezing fog", icon: "cloud-fog" },
  51: { label: "Light drizzle", icon: "cloud-drizzle" },
  53: { label: "Drizzle", icon: "cloud-drizzle" },
  55: { label: "Heavy drizzle", icon: "cloud-drizzle" },
  61: { label: "Light rain", icon: "cloud-rain" },
  63: { label: "Rain", icon: "cloud-rain" },
  65: { label: "Heavy rain", icon: "cloud-rain" },
  66: { label: "Freezing rain", icon: "cloud-rain" },
  67: { label: "Freezing rain", icon: "cloud-rain" },
  71: { label: "Light snow", icon: "snowflake" },
  73: { label: "Snow", icon: "snowflake" },
  75: { label: "Heavy snow", icon: "snowflake" },
  77: { label: "Snow grains", icon: "snowflake" },
  80: { label: "Rain showers", icon: "cloud-rain" },
  81: { label: "Rain showers", icon: "cloud-rain" },
  82: { label: "Violent showers", icon: "cloud-rain" },
  85: { label: "Snow showers", icon: "snowflake" },
  86: { label: "Snow showers", icon: "snowflake" },
  95: { label: "Thunderstorm", icon: "cloud-lightning" },
  96: { label: "Thunderstorm with hail", icon: "cloud-lightning" },
  99: { label: "Thunderstorm with hail", icon: "cloud-lightning" },
};

export function describeWeather(code: number) {
  return WMO[code] ?? { label: "Mixed conditions", icon: "cloud" };
}

const FORECAST_HORIZON_DAYS = 16;

export async function fetchForecast(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<ForecastResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + FORECAST_HORIZON_DAYS);

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { available: false, reason: "This trip has no dates set yet.", days: [] };
  }

  // Clamp the window to what Open-Meteo can actually answer.
  const from = start < today ? today : start;
  const to = end > horizon ? horizon : end;

  if (from > horizon) {
    const daysAway = Math.ceil((start.getTime() - today.getTime()) / 86_400_000);
    return {
      available: false,
      reason: `Departure is ${daysAway} days away — forecasts arrive about two weeks out.`,
      days: [],
    };
  }
  if (to < from) {
    return { available: false, reason: "These dates have already passed.", days: [] };
  }

  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
    `&timezone=auto&start_date=${iso(from)}&end_date=${iso(to)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
    const json = (await res.json()) as {
      daily?: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: (number | null)[];
        wind_speed_10m_max: number[];
      };
    };

    const d = json.daily;
    if (!d?.time?.length) {
      return { available: false, reason: "No forecast came back for this location.", days: [] };
    }

    const days: DailyForecast[] = d.time.map((date, i) => ({
      date,
      weatherCode: d.weather_code[i] ?? 3,
      tempMax: d.temperature_2m_max[i] ?? 0,
      tempMin: d.temperature_2m_min[i] ?? 0,
      precipitationProbability: d.precipitation_probability_max[i] ?? 0,
      windMax: d.wind_speed_10m_max[i] ?? 0,
    }));

    return {
      available: true,
      days,
      summary: {
        avgHigh: Math.round(days.reduce((s, x) => s + x.tempMax, 0) / days.length),
        avgLow: Math.round(days.reduce((s, x) => s + x.tempMin, 0) / days.length),
        rainiestChance: Math.max(...days.map((x) => x.precipitationProbability)),
        maxWind: Math.round(Math.max(...days.map((x) => x.windMax))),
      },
    };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? `Couldn't reach the weather service (${error.message}).` : "Couldn't reach the weather service.",
      days: [],
    };
  }
}
