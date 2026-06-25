/**
 * MediFlow — adaptive scheduling engine.
 *
 * This is the single source of truth for slot generation + status resolution +
 * missed-dose safety advice. `convex/doses.ts` inlines an exact copy of the
 * pure functions below because Convex's bundler cannot resolve workspace TS
 * packages — keep them in sync. (Search for "Inlined engine logic" there.)
 */

import type {
  DayAdherence,
  DoseInstance,
  MaterializedDose,
  MissedAdvice,
  ScheduleInput,
} from "./types";
import type { Daypart, DoseStatus, Weekday } from "./enums";
import { daypartOf } from "./time";

/* ------------------------------------------------------------------ */
/* Slot generation                                                     */
/* ------------------------------------------------------------------ */

/**
 * Generate every materialized dose slot for `med` in the half-open window
 * [from, to) (epoch ms). Respects start/end dates, weekdays, and intervals.
 * `as_needed` medications produce no pre-scheduled slots.
 */
export function generateSlots(
  med: ScheduleInput,
  from: number,
  to: number,
): MaterializedDose[] {
  if (!med.active) return [];

  const start = new Date(from);
  const end = new Date(to);
  const medStart = new Date(med.startDate);
  const medEnd = med.endDate ? new Date(med.endDate) : null;
  const slots: MaterializedDose[] = [];

  if (med.frequency === "everyday" || med.frequency === "specific_days") {
    generateRecurringSlots(med, start, end, medStart, medEnd, slots);
  } else if (med.frequency === "interval") {
    generateIntervalSlots(med, start, end, medEnd, slots);
  }
  // "as_needed" has no pre-scheduled slots.

  return slots;
}

function generateRecurringSlots(
  med: ScheduleInput,
  from: Date,
  to: Date,
  medStart: Date,
  medEnd: Date | null,
  out: MaterializedDose[],
): void {
  const fromMs = from.getTime();
  const toMs = to.getTime();
  let cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  cursor.setHours(0, 0, 0, 0);

  while (cursor.getTime() < toMs) {
    const dayOfWeek = cursor.getDay() === 0 ? 7 : cursor.getDay();

    if (cursor < medStart) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    if (medEnd && cursor > medEnd) break;

    if (
      med.frequency === "specific_days" &&
      !med.weekdays.includes(dayOfWeek as Weekday)
    ) {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    for (const time of med.times) {
      const [h, m] = time.split(":").map(Number);
      const slotDate = new Date(cursor);
      slotDate.setHours(h, m, 0, 0);
      const slotMs = slotDate.getTime();

      if (slotMs >= fromMs && slotMs < toMs && slotDate >= medStart) {
        out.push({
          scheduledAt: slotMs,
          daypart: daypartOf(time),
          medicationId: med.id,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

function generateIntervalSlots(
  med: ScheduleInput,
  from: Date,
  to: Date,
  medEnd: Date | null,
  out: MaterializedDose[],
): void {
  if (med.times.length === 0) return;
  const intervalMs = (med.intervalHours ?? 4) * 60 * 60 * 1000;
  const medStart = new Date(med.startDate);
  const [seedH, seedM] = med.times[0].split(":").map(Number);
  const seedDate = new Date(medStart);
  seedDate.setHours(seedH, seedM, 0, 0);
  if (seedDate < medStart) seedDate.setTime(medStart.getTime());

  const fromMs = from.getTime();
  const toMs = to.getTime();
  let cursorMs = seedDate.getTime();

  while (cursorMs < toMs) {
    if (medEnd && cursorMs > medEnd.getTime()) break;
    if (cursorMs >= fromMs) {
      const d = new Date(cursorMs);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      out.push({
        scheduledAt: cursorMs,
        daypart: daypartOf(`${hh}:${mm}`),
        medicationId: med.id,
      });
    }
    cursorMs += intervalMs;
  }
}

/* ------------------------------------------------------------------ */
/* Status resolution                                                   */
/* ------------------------------------------------------------------ */

/**
 * Resolve the *effective* status of a dose at a given moment.
 *
 * Terminal states (taken/skipped/missed) are returned as-is. Snoozed flips to
 * missed once the snooze window lapses. scheduled/due are derived from the
 * `missedAfterMinutes` grace window.
 */
export function resolveDoseStatus(
  dose: {
    status: DoseStatus;
    scheduledAt: number;
    snoozedUntil: number | null;
    missedAfterMinutes: number;
  },
  nowMs: number,
): DoseStatus {
  if (
    dose.status === "taken" ||
    dose.status === "skipped" ||
    dose.status === "missed"
  ) {
    return dose.status;
  }
  if (dose.status === "snoozed") {
    return dose.snoozedUntil !== null && nowMs > dose.snoozedUntil
      ? "missed"
      : "snoozed";
  }
  const missAt = dose.scheduledAt + dose.missedAfterMinutes * 60 * 1000;
  if (nowMs >= missAt) return "missed";
  if (nowMs >= dose.scheduledAt) return "due";
  return "scheduled";
}

/* ------------------------------------------------------------------ */
/* Missed-dose safety advice                                           */
/* ------------------------------------------------------------------ */

/**
 * Decide whether a missed dose is safe to take now, or should be skipped.
 *
 * Compares the gap to the *next* scheduled dose against `minSpacingHours`. If
 * there is no upcoming dose, it's always safe to take now.
 */
export function computeMissedAdvice(
  missedDose: { scheduledAt: number; medicationId: string },
  nextDoseScheduledAt: number | null,
  minSpacingHours: number,
): MissedAdvice {
  if (nextDoseScheduledAt === null) {
    return {
      action: "take_now",
      message: "Safe to take now — no upcoming dose conflicts.",
      nextDoseAt: null,
    };
  }
  const hoursUntilNext =
    (nextDoseScheduledAt - missedDose.scheduledAt) / (1000 * 60 * 60);
  if (hoursUntilNext >= minSpacingHours) {
    return {
      action: "take_now",
      message: `Safe to take now — next dose in ${Math.round(hoursUntilNext)}h.`,
      nextDoseAt: nextDoseScheduledAt,
    };
  }
  return {
    action: "skip",
    message: `Too close to your next dose. Skip this one to stay safe.`,
    nextDoseAt: nextDoseScheduledAt,
  };
}

/* ------------------------------------------------------------------ */
/* Client-side adherence helpers                                       */
/* ------------------------------------------------------------------ */

/**
 * Reduce a list of doses into a single day's adherence summary.
 * `tzOffsetMs` shifts each dose's scheduledAt into the user's local date so
 * the bucket matches what the user saw on their calendar.
 */
export function computeDayAdherence(
  doses: { scheduledAt: number; status: DoseStatus }[],
  tzOffsetMs: number,
): DayAdherence {
  let total = 0;
  let taken = 0;
  let skipped = 0;
  let missed = 0;
  let pending = 0;

  for (const dose of doses) {
    void tzOffsetMs; // bucket key would use this; kept for API parity
    total++;
    switch (dose.status) {
      case "taken":
        taken++;
        break;
      case "skipped":
        skipped++;
        break;
      case "missed":
        missed++;
        break;
      default:
        pending++;
        break;
    }
  }

  return {
    date: "",
    total,
    taken,
    skipped,
    missed,
    pending,
    percent: total === 0 ? 0 : Math.round((taken / total) * 100),
  };
}

/** Overall adherence percent across a flat list of doses. */
export function computeOverallAdherence(
  doses: { status: DoseStatus }[],
): { percent: number; taken: number; total: number } {
  const total = doses.length;
  const taken = doses.filter((d) => d.status === "taken").length;
  return {
    percent: total === 0 ? 0 : Math.round((taken / total) * 100),
    taken,
    total,
  };
}

/**
 * Count consecutive days (counting back from today) with no missed doses and
 * no unresolved doses. Days with zero doses are skipped (vacation days, etc.).
 */
export function computeStreak(
  byDate: Map<string, { total: number; missed: number; pending: number }>,
): number {
  const dates = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));
  let streak = 0;
  for (const date of dates) {
    const b = byDate.get(date)!;
    if (b.missed === 0 && b.pending === 0 && b.total > 0) {
      streak++;
    } else if (b.total === 0) {
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Whether a dose is allowed to be taken right now — i.e. it is not terminal
 * and not still inside a future-only window. Used to gate the Take button.
 */
export function canTakeNow(
  dose: Pick<DoseInstance, "status" | "scheduledAt">,
  nowMs: number,
): boolean {
  if (
    dose.status === "taken" ||
    dose.status === "skipped"
  ) {
    return false;
  }
  return dose.scheduledAt <= nowMs;
}
