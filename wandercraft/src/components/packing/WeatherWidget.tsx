"use client";

import {
  Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun,
  Snowflake, Sun, Wind, Droplets, CalendarOff,
} from "lucide-react";
import { Panel } from "@/components/ui/Card";
import { describeWeather, type ForecastResult } from "@/lib/openMeteo";
import { formatDate } from "@/lib/utils";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  "cloud-sun": CloudSun,
  cloud: Cloud,
  "cloud-fog": CloudFog,
  "cloud-drizzle": CloudDrizzle,
  "cloud-rain": CloudRain,
  "cloud-lightning": CloudLightning,
  snowflake: Snowflake,
};

export function WeatherWidget({
  forecast,
  destinationName,
  bestSeason,
}: {
  forecast: ForecastResult | null;
  destinationName: string;
  bestSeason?: string | null;
}) {
  if (!forecast) {
    return (
      <Panel className="p-5">
        <p className="text-sm text-muted">Checking the forecast…</p>
      </Panel>
    );
  }

  if (!forecast.available) {
    return (
      <Panel className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted">
            <CalendarOff className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-lg font-medium tracking-tight">No forecast yet</h3>
            <p className="mt-0.5 text-sm text-ink-2">{forecast.reason}</p>
            {bestSeason ? (
              <p className="mt-2 text-[13px] text-muted">
                <strong className="font-medium text-ink-2">Typically:</strong> {bestSeason}
              </p>
            ) : null}
          </div>
        </div>
      </Panel>
    );
  }

  const { summary, days } = forecast;

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-medium tracking-tight">Weather in {destinationName}</h3>
          <p className="text-sm text-muted">{days.length} days of your trip are within forecast range.</p>
        </div>
        {summary ? (
          <div className="flex gap-4 text-sm">
            <Metric label="Avg high" value={`${summary.avgHigh}°C`} />
            <Metric label="Avg low" value={`${summary.avgLow}°C`} />
            <Metric label="Rain" value={`${summary.rainiestChance}%`} icon={<Droplets className="h-3 w-3" />} />
            <Metric label="Wind" value={`${summary.maxWind}`} icon={<Wind className="h-3 w-3" />} />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {days.map((day) => {
          const meta = describeWeather(day.weatherCode);
          const Icon = ICONS[meta.icon] ?? Cloud;
          return (
            <div
              key={day.date}
              className="flex w-[92px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-2 py-3 text-center"
            >
              <span className="text-[11px] font-medium text-muted">
                {formatDate(day.date, { weekday: "short" })}
              </span>
              <Icon className="h-5 w-5 text-accent" aria-label={meta.label} />
              <span className="tnum text-sm font-semibold">{Math.round(day.tempMax)}°</span>
              <span className="tnum text-xs text-muted">{Math.round(day.tempMin)}°</span>
              {day.precipitationProbability >= 20 ? (
                <span className="tnum flex items-center gap-0.5 text-[10px] text-teal">
                  <Droplets className="h-2.5 w-2.5" />
                  {day.precipitationProbability}%
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="text-right">
      <p className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        {icon}
        {label}
      </p>
      <p className="tnum mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
