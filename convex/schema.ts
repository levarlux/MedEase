import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * MediFlow Convex schema.
 *
 * Ports shared/src/types.ts into Convex validators. Enum literal values are
 * byte-identical to shared/src/enums.ts — keep them in sync.
 *
 * Authorization model: every table carries a `tokenIdentifier` (the stable
 * auth subject from Kinde via ctx.auth.getUserIdentity()). All queries filter
 * by it; NEVER trust a client-supplied userId.
 */

/* ------------------------------------------------------------------ */
/* Enum unions — mirror shared/src/enums.ts exactly                    */
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

const doseStatus = v.union(
  v.literal("scheduled"),
  v.literal("due"),
  v.literal("taken"),
  v.literal("skipped"),
  v.literal("snoozed"),
  v.literal("missed"),
);

const daypart = v.union(
  v.literal("morning"),
  v.literal("noon"),
  v.literal("evening"),
  v.literal("night"),
);

const primaryGoal = v.union(
  v.literal("never_miss"),
  v.literal("chronic"),
  v.literal("wellness"),
);

const reminderStyle = v.union(
  v.literal("smart_adaptive"),
  v.literal("regular"),
);

const relationship = v.union(
  v.literal("spouse"),
  v.literal("child"),
  v.literal("friend"),
  v.literal("other"),
  v.literal("doctor"),
);

const conditionTag = v.union(
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
);

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export default defineSchema({
  /**
   * Profile row. One per authenticated user. Created on first login via
   * users.ensureProfile. `tokenIdentifier` is the canonical auth key.
   */
  users: defineTable({
    tokenIdentifier: v.string(),
    email: v.string(),
    fullName: v.string(),
    avatarUrl: v.optional(v.string()),
    primaryGoal: v.union(primaryGoal, v.null()),
    reminderStyle,
    medicationForms: v.array(medForm),
    conditions: v.array(conditionTag),
    onboardingCompleted: v.boolean(),
    memberSince: v.string(),
  })
    .index("by_token_identifier", ["tokenIdentifier"]),

  /** Emergency contact captured in onboarding step 7. */
  emergencyContacts: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    relationship,
    phone: v.string(),
  })
    .index("by_token_identifier", ["tokenIdentifier"]),

  /** Preferred pharmacy captured in onboarding step 8 (refill tracking). */
  pharmacies: defineTable({
    tokenIdentifier: v.string(),
    name: v.string(),
    address: v.string(),
    distanceMiles: v.union(v.number(), v.null()),
  })
    .index("by_token_identifier", ["tokenIdentifier"]),

  /**
   * A medication in the user's library. Schedule definition lives here;
   * concrete doses are materialized into `doseInstances`.
   */
  medications: defineTable({
    tokenIdentifier: v.string(),

    name: v.string(),
    strengthValue: v.number(),
    strengthUnit,
    form: medForm,
    foodRule,
    instructions: v.optional(v.string()),

    // --- schedule ---
    frequency,
    weekdays: v.array(weekday),
    times: v.array(v.string()),
    intervalHours: v.union(v.number(), v.null()),

    // --- safety constraints (drive adaptive engine) ---
    minSpacingHours: v.number(),
    dailyMax: v.number(),
    missedAfterMinutes: v.number(),

    // --- inventory / refill ---
    refillEnabled: v.boolean(),
    totalQuantity: v.number(),
    currentQuantity: v.number(),
    refillThreshold: v.number(),

    // --- presentation ---
    accent,
    icon: v.string(),

    // --- lifecycle ---
    startDate: v.string(),
    endDate: v.union(v.string(), v.null()),
    active: v.boolean(),
  })
    // Primary list view: a user's active meds, newest first.
    .index("by_token_identifier_and_active", ["tokenIdentifier", "active"])
    // Cron job scans active meds to materialize future doses.
    .index("by_active", ["active"]),

  /**
   * One concrete materialized dose. Generated by the engine from a
   * Medication's schedule, mutated as the user acts on it. Keyed naturally
   * by (medicationId, scheduledAt) for idempotent materialization.
   */
  doseInstances: defineTable({
    tokenIdentifier: v.string(),
    medicationId: v.id("medications"),

    scheduledAt: v.number(), // epoch ms — sortable, timezone-safe
    daypart,
    status: doseStatus,

    takenQty: v.union(v.number(), v.null()),
    takenAt: v.union(v.number(), v.null()),
    snoozedUntil: v.union(v.number(), v.null()),
    missedAdvice: v.union(
      v.object({
        action: v.union(v.literal("take_now"), v.literal("skip")),
        message: v.string(),
        nextDoseAt: v.union(v.number(), v.null()),
      }),
      v.null(),
    ),
  })
    // Dashboard / schedule: today's doses for a user, ordered by time.
    .index("by_token_identifier_and_scheduled_at", ["tokenIdentifier", "scheduledAt"])
    // Per-medication view (library detail, deletion cascade).
    .index("by_medication_id_and_scheduled_at", ["medicationId", "scheduledAt"])
    // Materialization idempotency check.
    .index("by_medication_id_and_status", ["medicationId", "status"]),

  /**
   * Immutable audit log. Every take/skip/snooze/miss/unsnooze appends a row.
   * Source of truth for insights & streaks; never mutated after insert.
   */
  doseEvents: defineTable({
    tokenIdentifier: v.string(),
    doseInstanceId: v.id("doseInstances"),
    medicationId: v.id("medications"),
    kind: v.union(
      v.literal("taken"),
      v.literal("skipped"),
      v.literal("snoozed"),
      v.literal("unsnoozed"),
      v.literal("missed"),
    ),
    quantity: v.union(v.number(), v.null()),
    at: v.number(), // epoch ms
    note: v.optional(v.string()),
  })
    // Insights aggregation: a user's events in a time window.
    .index("by_token_identifier_and_at", ["tokenIdentifier", "at"])
    // Audit trail for a single dose.
    .index("by_dose_instance", ["doseInstanceId"]),

  /** Per-user app settings (notification behavior, quiet hours, security). */
  settings: defineTable({
    tokenIdentifier: v.string(),

    // notifications
    smartReminders: v.boolean(),
    criticalSound: v.boolean(),
    quietHoursStart: v.string(), // "22:00"
    quietHoursEnd: v.string(), // "07:00"
    leadTimeMinutes: v.number(),
    snoozeMinutes: v.number(),

    // security
    twoFactorEnabled: v.boolean(),
    biometricUnlock: v.boolean(),
  })
    .index("by_token_identifier", ["tokenIdentifier"]),
});
