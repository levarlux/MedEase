import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { requireIdentity, requireUser } from "./lib/auth";

/**
 * Session gate: returns the caller's profile state so the client can route.
 *   - null          → not authenticated
 *   - {exists:false}→ authenticated, needs onboarding
 *   - {exists:true} → fully set up
 */
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const profile = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!profile) {
      return {
        exists: false as const,
        email: identity.email ?? "",
        name: identity.name ?? "",
        pictureUrl: (identity.pictureUrl as string | undefined) ?? null,
      };
    }

    return { exists: true as const, profile };
  },
});

/**
 * Idempotent profile bootstrap on first login.
 * Internal-only: called by an action after Kinde login completes.
 */
export const ensureProfile = internalMutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token_identifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) return existing._id;

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email,
      fullName: identity.name ?? identity.email.split("@")[0],
      avatarUrl: identity.pictureUrl ?? undefined,
      primaryGoal: null,
      reminderStyle: "smart_adaptive",
      medicationForms: [],
      conditions: [],
      onboardingCompleted: false,
      memberSince: new Date(now).toISOString(),
    });

    // Seed default settings so the UI never reads undefined.
    await ctx.db.insert("settings", {
      tokenIdentifier: identity.tokenIdentifier,
      smartReminders: true,
      criticalSound: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      leadTimeMinutes: 0,
      snoozeMinutes: 10,
      twoFactorEnabled: false,
      biometricUnlock: false,
    });

    return id;
  },
});

/** Update editable profile fields (post-onboarding edits). */
export const updateProfile = internalMutation({
  args: {
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    primaryGoal: v.optional(
      v.union(
        v.literal("never_miss"),
        v.literal("chronic"),
        v.literal("wellness"),
        v.null(),
      ),
    ),
    reminderStyle: v.optional(
      v.union(v.literal("smart_adaptive"), v.literal("regular")),
    ),
    medicationForms: v.optional(
      v.array(
        v.union(
          v.literal("pill"),
          v.literal("injection"),
          v.literal("liquid"),
          v.literal("other"),
        ),
      ),
    ),
    conditions: v.optional(
      v.array(
        v.union(
          v.literal("hypertension"),
          v.literal("diabetes_type_1"),
          v.literal("diabetes_type_2"),
          v.literal("asthma"),
          v.literal("cholesterol"),
          v.literal("heart_disease"),
          v.literal("anxiety"),
          v.literal("insomnia"),
          v.literal("arthritis"),
          v.literal("other"),
        ),
      ),
    ),
    onboardingCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireUser(ctx);
    await ctx.db.patch(profile._id, args);
    return profile._id;
  },
});
