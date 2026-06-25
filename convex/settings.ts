import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { requireIdentity } from "./lib/auth";

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

/** Get the caller's settings. Returns null if not yet seeded. */
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    return await ctx.db
      .query("settings")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
  },
});

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

/** Patch the caller's settings. Only provided fields are updated. */
export const update = mutation({
  args: {
    smartReminders: v.optional(v.boolean()),
    criticalSound: v.optional(v.boolean()),
    quietHoursStart: v.optional(v.string()),
    quietHoursEnd: v.optional(v.string()),
    leadTimeMinutes: v.optional(v.number()),
    snoozeMinutes: v.optional(v.number()),
    twoFactorEnabled: v.optional(v.boolean()),
    biometricUnlock: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!existing) {
      throw new Error("SETTINGS_NOT_FOUND: complete onboarding first.");
    }

    await ctx.db.patch("settings", existing._id, args);
    return existing._id;
  },
});
