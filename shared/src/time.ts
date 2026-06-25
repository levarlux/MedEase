/**
 * MediFlow — pure time + daypart helpers.
 *
 * Everything here is timezone-agnostic at the value level (operates on
 * "HH:MM" strings and local Date objects) so the same logic works on the
 * client and inside Convex. The Convex insight queries bucket by local date
 * by passing an explicit tzOffsetMs.
 */

import type { Daypart, Weekday } from "./enums";

/** Display order for the four dayparts in the timeline. */
export const DAYPART_ORDER: Daypart[] = ["morning", "noon", "evening", "night"];

/** Human label for each daypart. */
export const DAYPART_LABEL: Record<Daypart, string> = {
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
  night: "Night",
};

/**
 * Map a "HH:MM" time string to a daypart bucket.
 *
 *   05:00–10:59 → morning
 *   11:00–15:59 → noon
 *   16:00–20:59 → evening
 *   else        → night
 */
export function daypartOf(time: string): Daypart {
  const h = Number(time.split(":")[0]);
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "noon";
  if (h >= 16 && h < 21) return "evening";
  return "night";
}

/** Lexicographic comparison for "HH:MM" strings. Negative => a < b. */
export function compareTime(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Format a "HH:MM" (24h) string as 12h with am/pm, e.g. "08:00" → "8:00 AM". */
export function format12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${suffix}`;
}

/** Convert a Date to a local "YYYY-MM-DD" key (no UTC drift). */
export function localDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Return a new Date `days` days after `date` (does not mutate input). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Convert a JS getDay() result (0=Sun..6=Sat) to the ISO Weekday used by
 * schedules (1=Mon..7=Sun).
 */
export function isoWeekday(jsDay: number): Weekday {
  return (jsDay === 0 ? 7 : jsDay) as Weekday;
}

/** Short labels for the ISO weekday values (Mon..Sun). Index 1..7. */
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun",
};
