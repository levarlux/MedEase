import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { requireIdentity, requireUser } from "./lib/auth";

/* ------------------------------------------------------------------ */
/* Inlined engine logic                                                */
/*                                                                    */
/* These pure functions mirror shared/src/engine.ts exactly. They are */
/* duplicated here because Convex's bundler cannot resolve workspace   */
/* TypeScript packages. If shared/ is ever built to JS, we can switch */
/* to importing @mediflow/shared instead. Keep in sync with engine.ts. */
/* ------------------------------------------------------------------ */

type DoseStatus =
  | "scheduled" | "due" | "taken" | "skipped" | "snoozed" | "missed";

type Daypart = "morning" | "noon" | "evening" | "night";

type Frequency =
  | "everyday" | "specific_days" | "as_needed" | "interval";

type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ScheduleInput {
  id: string;
  frequency: Frequency;
  weekdays: Weekday[];
  times: string[];
  intervalHours: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

interface MaterializedDose {
  scheduledAt: number;
  daypart: Daypart;
  medicationId: string;
}

function daypartOf(time: string): Daypart {
  const h = Number(time.split(":")[0]);
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "noon";
  if (h >= 16 && h < 21) return "evening";
  return "night";
}

function generateSlots(
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
    generateIntervalSlots(med, start, end, medStart, medEnd, slots);
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
        out.push({ scheduledAt: slotMs, daypart: daypartOf(time), medicationId: med.id });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
}

function generateIntervalSlots(
  med: ScheduleInput,
  from: Date,
  to: Date,
  medStart: Date,
  medEnd: Date | null,
  out: MaterializedDose[],
): void {
  if (med.times.length === 0) return;
  const intervalMs = (med.intervalHours ?? 4) * 60 * 60 * 1000;
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
      out.push({ scheduledAt: cursorMs, daypart: daypartOf(`${hh}:${mm}`), medicationId: med.id });
    }
    cursorMs += intervalMs;
  }
}

function resolveDoseStatus(
  dose: { status: DoseStatus; scheduledAt: number; snoozedUntil: number | null; missedAfterMinutes: number },
  nowMs: number,
): DoseStatus {
  if (dose.status === "taken" || dose.status === "skipped" || dose.status === "missed") {
    return dose.status;
  }
  if (dose.status === "snoozed") {
    return dose.snoozedUntil !== null && nowMs > dose.snoozedUntil ? "missed" : "snoozed";
  }
  const missAt = dose.scheduledAt + dose.missedAfterMinutes * 60 * 1000;
  if (nowMs >= missAt) return "missed";
  if (nowMs >= dose.scheduledAt) return "due";
  return "scheduled";
}

function computeMissedAdvice(
  missedDose: { scheduledAt: number; medicationId: string },
  nextDoseScheduledAt: number | null,
  minSpacingHours: number,
) {
  if (nextDoseScheduledAt === null) {
    return {
      action: "take_now" as const,
      message: "Safe to take now — no upcoming dose conflicts.",
      nextDoseAt: null as null,
    };
  }
  const hoursUntilNext = (nextDoseScheduledAt - missedDose.scheduledAt) / (1000 * 60 * 60);
  if (hoursUntilNext >= minSpacingHours) {
    return {
      action: "take_now" as const,
      message: `Safe to take now — next dose in ${Math.round(hoursUntilNext)}h.`,
      nextDoseAt: nextDoseScheduledAt,
    };
  }
  return {
    action: "skip" as const,
    message: `Too close to your next dose. Skip this one to stay safe.`,
    nextDoseAt: nextDoseScheduledAt,
  };
}

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Get today's doses for the authenticated user, ordered by scheduled time. */
export const listToday = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const now = Date.now();
    const todayStart = now - 24 * 60 * 60 * 1000;
    const todayEnd = now + 24 * 60 * 60 * 1000;

    const doses = await ctx.db
      .query("doseInstances")
      .withIndex(
        "by_token_identifier_and_scheduled_at",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("asc")
      .take(200);

    const result: Array<{
      dose: Doc<"doseInstances">;
      medicationName: string;
      medicationAccent: string;
      medicationIcon: string;
      medicationForm: string;
      strengthValue: number;
      strengthUnit: string;
    }> = [];

    for (const dose of doses) {
      if (dose.scheduledAt < todayStart || dose.scheduledAt > todayEnd) continue;
      const med = await ctx.db.get("medications", dose.medicationId);
      if (!med) continue;
      result.push({
        dose,
        medicationName: med.name,
        medicationAccent: med.accent,
        medicationIcon: med.icon,
        medicationForm: med.form,
        strengthValue: med.strengthValue,
        strengthUnit: med.strengthUnit,
      });
    }

    return result;
  },
});

/** Get doses for a specific date range — used by the Schedule screen. */
export const listByRange = query({
  args: {
    from: v.number(),
    to: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const doses = await ctx.db
      .query("doseInstances")
      .withIndex(
        "by_token_identifier_and_scheduled_at",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .order("asc")
      .take(500);

    const result: Array<{
      dose: Doc<"doseInstances">;
      medicationName: string;
      medicationAccent: string;
      medicationIcon: string;
    }> = [];

    for (const dose of doses) {
      if (dose.scheduledAt < args.from || dose.scheduledAt >= args.to) continue;
      const med = await ctx.db.get("medications", dose.medicationId);
      if (!med) continue;
      result.push({
        dose,
        medicationName: med.name,
        medicationAccent: med.accent,
        medicationIcon: med.icon,
      });
    }

    return result;
  },
});

/** Get a single dose instance (owner check enforced). */
export const get = query({
  args: { id: v.id("doseInstances") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const dose = await ctx.db.get("doseInstances", args.id);
    if (!dose || dose.tokenIdentifier !== identity.tokenIdentifier) return null;
    return dose;
  },
});

/** Get audit events for a dose instance. */
export const getEvents = query({
  args: { doseInstanceId: v.id("doseInstances") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const dose = await ctx.db.get("doseInstances", args.doseInstanceId);
    if (!dose || dose.tokenIdentifier !== identity.tokenIdentifier) return [];

    return await ctx.db
      .query("doseEvents")
      .withIndex("by_dose_instance", (q) =>
        q.eq("doseInstanceId", args.doseInstanceId),
      )
      .order("desc")
      .take(50);
  },
});

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Mark a dose as taken. Creates audit event. */
export const takeDose = mutation({
  args: {
    doseInstanceId: v.id("doseInstances"),
    quantity: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const now = Date.now();

    const dose = await ctx.db.get("doseInstances", args.doseInstanceId);
    if (!dose || dose.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: dose not found or access denied.");
    }

    if (
      dose.status !== "scheduled" &&
      dose.status !== "due" &&
      dose.status !== "snoozed" &&
      dose.status !== "missed"
    ) {
      throw new Error("INVALID_STATE: dose is already taken or skipped.");
    }

    const med = await ctx.db.get("medications", dose.medicationId);
    if (!med) throw new Error("NOT_FOUND: medication not found.");

    // Enforce min spacing.
    const recentDoses = await ctx.db
      .query("doseInstances")
      .withIndex("by_medication_id_and_scheduled_at", (q) =>
        q.eq("medicationId", dose.medicationId),
      )
      .order("desc")
      .take(10);

    const lastTaken = recentDoses.find(
      (d) => d.status === "taken" && d.takenAt !== null && d._id !== dose._id,
    );

    if (lastTaken?.takenAt) {
      const hoursSince = (now - lastTaken.takenAt) / (1000 * 60 * 60);
      if (hoursSince < med.minSpacingHours) {
        throw new Error(
          `TOO_SOON: Wait ${(med.minSpacingHours - hoursSince).toFixed(1)}h before next dose.`,
        );
      }
    }

    const qty = args.quantity ?? 1;

    await ctx.db.patch("doseInstances", args.doseInstanceId, {
      status: "taken",
      takenQty: qty,
      takenAt: now,
      snoozedUntil: null,
    });

    await ctx.db.insert("doseEvents", {
      tokenIdentifier: identity.tokenIdentifier,
      doseInstanceId: args.doseInstanceId,
      medicationId: dose.medicationId,
      kind: "taken",
      quantity: qty,
      at: now,
      ...(args.note !== undefined && { note: args.note }),
    });

    return args.doseInstanceId;
  },
});

/** Mark a dose as skipped. */
export const skipDose = mutation({
  args: {
    doseInstanceId: v.id("doseInstances"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const now = Date.now();

    const dose = await ctx.db.get("doseInstances", args.doseInstanceId);
    if (!dose || dose.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: dose not found or access denied.");
    }

    if (dose.status === "taken" || dose.status === "skipped") {
      throw new Error("INVALID_STATE: dose already resolved.");
    }

    await ctx.db.patch("doseInstances", args.doseInstanceId, {
      status: "skipped",
      snoozedUntil: null,
    });

    await ctx.db.insert("doseEvents", {
      tokenIdentifier: identity.tokenIdentifier,
      doseInstanceId: args.doseInstanceId,
      medicationId: dose.medicationId,
      kind: "skipped",
      quantity: null,
      at: now,
      ...(args.note !== undefined && { note: args.note }),
    });

    return args.doseInstanceId;
  },
});

/** Snooze a dose — pushes the reminder back. */
export const snoozeDose = mutation({
  args: {
    doseInstanceId: v.id("doseInstances"),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const now = Date.now();

    const dose = await ctx.db.get("doseInstances", args.doseInstanceId);
    if (!dose || dose.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: dose not found or access denied.");
    }

    if (dose.status !== "due" && dose.status !== "scheduled") {
      throw new Error("INVALID_STATE: can only snooze due/scheduled doses.");
    }

    const settings = await ctx.db
      .query("settings")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    const snoozeMinutes = settings?.snoozeMinutes ?? 10;
    const snoozedUntil = now + snoozeMinutes * 60 * 1000;

    await ctx.db.patch("doseInstances", args.doseInstanceId, {
      status: "snoozed",
      snoozedUntil,
    });

    await ctx.db.insert("doseEvents", {
      tokenIdentifier: identity.tokenIdentifier,
      doseInstanceId: args.doseInstanceId,
      medicationId: dose.medicationId,
      kind: "snoozed",
      quantity: null,
      at: now,
    });

    return { snoozedUntil };
  },
});

/**
 * Cron: materialize dose slots + transition statuses.
 *
 * Scans all active medications, generates slots for the next 48h,
 * inserts missing ones, and transitions scheduled→due→missed.
 */
export const materializeDoses = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const windowEnd = now + 48 * 60 * 60 * 1000;

    const activeMeds = await ctx.db
      .query("medications")
      .withIndex("by_active", (q) => q.eq("active", true))
      .take(200);

    for (const med of activeMeds) {
      const scheduleInput: ScheduleInput = {
        id: String(med._id),
        frequency: med.frequency,
        weekdays: med.weekdays as Weekday[],
        times: med.times,
        intervalHours: med.intervalHours,
        startDate: med.startDate,
        endDate: med.endDate,
        active: med.active,
      };

      const slots = generateSlots(scheduleInput, now, windowEnd);

      for (const slot of slots) {
        const existing = await ctx.db
          .query("doseInstances")
          .withIndex("by_medication_id_and_scheduled_at", (q) =>
            q.eq("medicationId", med._id).eq("scheduledAt", slot.scheduledAt),
          )
          .unique();

        if (existing) {
          const newStatus = resolveDoseStatus(
            {
              status: existing.status,
              scheduledAt: existing.scheduledAt,
              snoozedUntil: existing.snoozedUntil,
              missedAfterMinutes: med.missedAfterMinutes,
            },
            now,
          );

          if (newStatus !== existing.status) {
            const update: Record<string, unknown> = { status: newStatus };

            if (newStatus === "missed") {
              const nextDose = await ctx.db
                .query("doseInstances")
                .withIndex("by_medication_id_and_scheduled_at", (q) =>
                  q.eq("medicationId", med._id),
                )
                .filter((q) => q.gt(q.field("scheduledAt"), slot.scheduledAt))
                .first();

              update.missedAdvice = computeMissedAdvice(
                { scheduledAt: slot.scheduledAt, medicationId: String(med._id) },
                nextDose?.scheduledAt ?? null,
                med.minSpacingHours,
              );

              await ctx.db.insert("doseEvents", {
                tokenIdentifier: med.tokenIdentifier,
                doseInstanceId: existing._id,
                medicationId: med._id,
                kind: "missed",
                quantity: null,
                at: now,
              });
            }

            await ctx.db.patch("doseInstances", existing._id, update);
          }
        } else {
          await ctx.db.insert("doseInstances", {
            tokenIdentifier: med.tokenIdentifier,
            medicationId: med._id,
            scheduledAt: slot.scheduledAt,
            daypart: slot.daypart,
            status: slot.scheduledAt <= now ? "due" : "scheduled",
            takenQty: null,
            takenAt: null,
            snoozedUntil: null,
            missedAdvice: null,
          });
        }
      }
    }

    return { processedAt: now, medCount: activeMeds.length };
  },
});
