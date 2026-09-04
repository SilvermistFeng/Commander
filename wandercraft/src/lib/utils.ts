import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Currencies that conventionally have no minor unit. */
const ZERO_DECIMAL = new Set(["JPY", "VND", "KRW", "ISK", "CLP", "HUF"]);

export function formatCurrency(amount: number, currency = "USD") {
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(digits)}`;
  }
}

/** Compact money for tight spaces: $1.2k rather than $1,234.00 */
export function formatCompactCurrency(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount)}`;
  }
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", opts ?? { day: "numeric", month: "short", year: "numeric" }).format(d);
}

export function formatDateRange(start: string | Date, end: string | Date) {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();
  const left = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: sameMonth ? undefined : "short",
    year: sameYear ? undefined : "numeric",
  }).format(s);
  const right = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(e);
  return `${left} – ${right}`;
}

/** Inclusive night-to-night length of a trip, minimum 1. */
export function tripDayCount(start: string | Date, end: string | Date) {
  const s = startOfDay(typeof start === "string" ? new Date(start) : start);
  const e = startOfDay(typeof end === "string" ? new Date(end) : end);
  const diff = Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return Math.max(1, Number.isFinite(diff) ? diff : 1);
}

export function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(date: string | Date, days: number) {
  const d = new Date(typeof date === "string" ? date : date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/** The calendar date a given day number of the trip falls on. */
export function dateForDay(startDate: string | Date, dayNumber: number) {
  return addDays(startDate, dayNumber - 1);
}

/** Which day number of the trip is "today", or null if we're outside the trip. */
export function currentTripDay(startDate: string | Date, endDate: string | Date, now = new Date()) {
  const s = startOfDay(new Date(startDate));
  const e = startOfDay(new Date(endDate));
  const t = startOfDay(now);
  if (t < s || t > e) return null;
  return Math.round((t.getTime() - s.getTime()) / 86_400_000) + 1;
}

export function toISODateInput(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "09:00" -> minutes since midnight, for sorting a day's activities. */
export function timeToMinutes(time: string | null | undefined) {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return Number.MAX_SAFE_INTEGER;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

export function formatTimeRange(start: string | null, end: string | null) {
  if (!start && !end) return "";
  if (start && end) return `${start} – ${end}`;
  return start ?? end ?? "";
}

export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Stable pseudo-random id that works in the browser and on the server. */
export function makeId(prefix = "id") {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${rand}`;
}

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
