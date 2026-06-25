import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

/* ------------------------------------------------------------------ */
/* Types returned to the client                                        */
/* ------------------------------------------------------------------ */

export interface DaySummary {
  date: string; // YYYY-MM-DD
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  pending: number;
  percent: number;
}

export interface MedAdherenceRow {
  medicationId: string;
  name: string;
  scheduleLabel: string;
  adherencePct: number | null;
  accent: string;
  icon: string;
  currentQuantity: number;
  totalQuantity: number;
  refillThreshold: number;
  refillEnabled: boolean;
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/**
 * Get adherence summary for the last N days (default 7).
 *
 * Aggregates doseInstances by local date. The client passes a tzOffsetMs
 * so dates are bucketed in the user's local time, not UTC.
 */
export const getRange = query({
  args: {
    days: v.optional(v.number()),
    tzOffsetMs: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const days = args.days ?? 7;

    const now = Date.now();
    const from = now - days * 24 * 60 * 60 * 1000;

    const doses = await ctx.db
      .query("doseInstances")
      .withIndex(
        "by_token_identifier_and_scheduled_at",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("asc")
      .take(2000);

    // Bucket by local date.
    const byDate = new Map<string, {
      total: number; taken: number; skipped: number; missed: number; pending: number;
    }>();

    for (const dose of doses) {
      if (dose.scheduledAt < from) continue;
      const localMs = dose.scheduledAt + args.tzOffsetMs;
      const d = new Date(localMs);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

      if (!byDate.has(date)) {
        byDate.set(date, { total: 0, taken: 0, skipped: 0, missed: 0, pending: 0 });
      }
      const bucket = byDate.get(date)!;
      bucket.total++;
      switch (dose.status) {
        case "taken": bucket.taken++; break;
        case "skipped": bucket.skipped++; break;
        case "missed": bucket.missed++; break;
        default: bucket.pending++; break;
      }
    }

    const summaries: DaySummary[] = [];
    for (const [date, b] of byDate) {
      summaries.push({
        date,
        total: b.total,
        taken: b.taken,
        skipped: b.skipped,
        missed: b.missed,
        pending: b.pending,
        percent: b.total === 0 ? 0 : Math.round((b.taken / b.total) * 100),
      });
    }
    summaries.sort((a, b) => a.date.localeCompare(b.date));
    return summaries;
  },
});

/**
 * Get per-medication adherence + inventory status.
 * Window defaults to 30 days.
 */
export const getMedAdherence = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const days = args.days ?? 30;
    const now = Date.now();
    const from = now - days * 24 * 60 * 60 * 1000;

    const meds = await ctx.db
      .query("medications")
      .withIndex(
        "by_token_identifier_and_active",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .take(100);

    const rows: MedAdherenceRow[] = [];

    for (const med of meds) {
      // Count doses of this med in the window.
      const doses = await ctx.db
        .query("doseInstances")
        .withIndex("by_medication_id_and_scheduled_at", (q) =>
          q.eq("medicationId", med._id),
        )
        .take(500);

      let total = 0;
      let taken = 0;
      for (const d of doses) {
        if (d.scheduledAt < from) continue;
        total++;
        if (d.status === "taken") taken++;
      }

      const adherencePct = total === 0 ? null : Math.round((taken / total) * 100);

      const scheduleLabel =
        med.frequency === "everyday"
          ? med.times.length > 1 ? `${med.times.length}× daily` : "Daily"
          : med.frequency === "specific_days"
            ? `${med.weekdays.length}× weekly`
            : med.frequency === "interval"
              ? `Every ${med.intervalHours ?? 0}h`
              : "As needed";

      rows.push({
        medicationId: med._id,
        name: med.name,
        scheduleLabel,
        adherencePct,
        accent: med.accent,
        icon: med.icon,
        currentQuantity: med.currentQuantity,
        totalQuantity: med.totalQuantity,
        refillThreshold: med.refillThreshold,
        refillEnabled: med.refillEnabled,
      });
    }

    return rows;
  },
});

/**
 * Get current streak — consecutive days with no missed doses,
 * counting back from today.
 */
export const getStreak = query({
  args: {
    tzOffsetMs: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const from = now - 30 * 24 * 60 * 60 * 1000; // 30 days for streak

    const doses = await ctx.db
      .query("doseInstances")
      .withIndex(
        "by_token_identifier_and_scheduled_at",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("asc")
      .take(2000);

    // Bucket by local date.
    const byDate = new Map<string, { total: number; missed: number; pending: number }>();
    for (const dose of doses) {
      if (dose.scheduledAt < from) continue;
      const localMs = dose.scheduledAt + args.tzOffsetMs;
      const d = new Date(localMs);
      const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      if (!byDate.has(date)) {
        byDate.set(date, { total: 0, missed: 0, pending: 0 });
      }
      const b = byDate.get(date)!;
      b.total++;
      if (dose.status === "missed") b.missed++;
      if (dose.status === "scheduled" || dose.status === "due" || dose.status === "snoozed") b.pending++;
    }

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

    return { streak, daysTracked: dates.length };
  },
});

// Re-export Doc for downstream type usage.
export type { Doc } from "./_generated/dataModel";
