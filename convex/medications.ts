import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireUser } from "./lib/auth";
import type { Id } from "./_generated/dataModel";

/* ------------------------------------------------------------------ */
/* Validators (re-use schema-level unions)                             */
/* ------------------------------------------------------------------ */

const medForm = v.union(
  v.literal("pill"),
  v.literal("injection"),
  v.literal("liquid"),
  v.literal("other"),
);

const strengthUnit = v.union(
  v.literal("mg"),
  v.literal("mcg"),
  v.literal("ml"),
  v.literal("g"),
  v.literal("IU"),
  v.literal("puff"),
  v.literal("drop"),
);

const foodRule = v.union(
  v.literal("with_food"),
  v.literal("empty_stomach"),
  v.literal("anytime"),
);

const frequency = v.union(
  v.literal("everyday"),
  v.literal("specific_days"),
  v.literal("as_needed"),
  v.literal("interval"),
);

const weekday = v.union(
  v.literal(1), v.literal(2), v.literal(3), v.literal(4),
  v.literal(5), v.literal(6), v.literal(7),
);

const accent = v.union(
  v.literal("primary"),
  v.literal("secondary"),
  v.literal("tertiary"),
  v.literal("error"),
);

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** List a user's medications — active first, then archived, newest first. */
export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);

    let q = ctx.db
      .query("medications")
      .withIndex(
        "by_token_identifier_and_active",
        (q) => q.eq("tokenIdentifier", identity.tokenIdentifier),
      );

    if (args.activeOnly) {
      // Active-only index scan — first page only, capped at 50.
      return await q.order("desc").take(50);
    }

    // Fetch all (capped for safety). Pagination could be added later.
    const active = await q.order("desc").take(100);
    return active;
  },
});

/** Get a single medication by ID (owner check enforced). */
export const get = query({
  args: { id: v.id("medications") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const med = await ctx.db.get("medications", args.id);
    if (!med || med.tokenIdentifier !== identity.tokenIdentifier) {
      return null;
    }
    return med;
  },
});

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Create a new medication for the authenticated user. */
export const create = mutation({
  args: {
    name: v.string(),
    strengthValue: v.number(),
    strengthUnit,
    form: medForm,
    foodRule,
    instructions: v.optional(v.string()),

    // schedule
    frequency,
    weekdays: v.array(weekday),
    times: v.array(v.string()),
    intervalHours: v.union(v.number(), v.null()),

    // safety constraints
    minSpacingHours: v.number(),
    dailyMax: v.number(),
    missedAfterMinutes: v.number(),

    // inventory / refill
    refillEnabled: v.boolean(),
    totalQuantity: v.number(),
    currentQuantity: v.number(),
    refillThreshold: v.number(),

    // presentation
    accent,
    icon: v.string(),

    // lifecycle
    startDate: v.string(),
    endDate: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);

    // Guard: frequency/fields coherence.
    if (args.frequency === "specific_days" && args.weekdays.length === 0) {
      throw new Error("VALIDATION: specific_days requires at least one weekday.");
    }
    if (args.frequency === "interval" && args.intervalHours === null) {
      throw new Error("VALIDATION: interval frequency requires intervalHours.");
    }
    if (
      (args.frequency === "everyday" || args.frequency === "specific_days") &&
      args.times.length === 0
    ) {
      throw new Error("VALIDATION: this frequency requires at least one time.");
    }

    const id = await ctx.db.insert("medications", {
      tokenIdentifier: identity.tokenIdentifier,
      ...args,
      active: true,
    });

    return id;
  },
});

/** Update mutable fields on a medication. Only the owner can edit. */
export const update = mutation({
  args: {
    id: v.id("medications"),
    name: v.optional(v.string()),
    strengthValue: v.optional(v.number()),
    strengthUnit: v.optional(strengthUnit),
    form: v.optional(medForm),
    foodRule: v.optional(foodRule),
    instructions: v.optional(v.string()),

    // schedule
    frequency: v.optional(frequency),
    weekdays: v.optional(v.array(weekday)),
    times: v.optional(v.array(v.string())),
    intervalHours: v.optional(v.union(v.number(), v.null())),

    // safety constraints
    minSpacingHours: v.optional(v.number()),
    dailyMax: v.optional(v.number()),
    missedAfterMinutes: v.optional(v.number()),

    // inventory / refill
    refillEnabled: v.optional(v.boolean()),
    totalQuantity: v.optional(v.number()),
    currentQuantity: v.optional(v.number()),
    refillThreshold: v.optional(v.number()),

    // presentation
    accent: v.optional(accent),
    icon: v.optional(v.string()),

    // lifecycle
    endDate: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const existing = await ctx.db.get("medications", args.id);
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: medication not found or access denied.");
    }

    const { id: _id, ...fields } = args;
    await ctx.db.patch("medications", args.id, fields);
    return args.id;
  },
});

/** Soft-deactivate a medication (sets active=false). Data is preserved. */
export const deactivate = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const existing = await ctx.db.get("medications", args.id);
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: medication not found or access denied.");
    }
    await ctx.db.patch("medications", args.id, { active: false });
    return args.id;
  },
});

/** Reactivate a medication. */
export const reactivate = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const existing = await ctx.db.get("medications", args.id);
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: medication not found or access denied.");
    }
    await ctx.db.patch("medications", args.id, { active: true });
    return args.id;
  },
});

/** Hard-delete a medication and all its dose instances/events. */
export const remove = mutation({
  args: { id: v.id("medications") },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const existing = await ctx.db.get("medications", args.id);
    if (!existing || existing.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: medication not found or access denied.");
    }

    // Delete all dose instances for this medication.
    const doseInstances = await ctx.db
      .query("doseInstances")
      .withIndex("by_medication_id_and_scheduled_at", (q) =>
        q.eq("medicationId", args.id),
      )
      .take(500);

    for (const di of doseInstances) {
      // Also delete associated events.
      const events = await ctx.db
        .query("doseEvents")
        .withIndex("by_dose_instance", (q) => q.eq("doseInstanceId", di._id))
        .take(50);
      for (const ev of events) {
        await ctx.db.delete("doseEvents", ev._id);
      }
      await ctx.db.delete("doseInstances", di._id);
    }

    await ctx.db.delete("medications", args.id);
    return args.id;
  },
});

/**
 * Decrement currentQuantity after a dose is taken.
 * Called by the takeDose mutation in doses.ts.
 */
export const decrementInventory = mutation({
  args: {
    medicationId: v.id("medications"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const { identity } = await requireUser(ctx);
    const med = await ctx.db.get("medications", args.medicationId);
    if (!med || med.tokenIdentifier !== identity.tokenIdentifier) {
      throw new Error("NOT_FOUND: medication not found or access denied.");
    }
    if (!med.refillEnabled) return;

    const newQty = Math.max(0, med.currentQuantity - args.quantity);
    await ctx.db.patch("medications", args.medicationId, {
      currentQuantity: newQty,
    });
  },
});
