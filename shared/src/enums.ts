/**
 * MediFlow — shared enum-like string unions.
 *
 * These literal values are byte-identical to the Convex schema validators
 * (convex/schema.ts) and to the values stored in the database. Do NOT change
 * a literal here without updating both sides.
 *
 * They are expressed as `string`-extending unions (rather than `enum`s) so
 * they survive serialization to/from Convex without a runtime object and so
 * the Convex `v.literal(...)` validators can mirror them 1:1.
 */

/** Physical form of a medication — drives the icon + form chip. */
export type MedForm = "pill" | "injection" | "liquid" | "other";

/** Unit for a medication's strength value. */
export type StrengthUnit =
  | "mg"
  | "mcg"
  | "ml"
  | "g"
  | "IU"
  | "puff"
  | "drop";

/** Food rule — whether to take with food, on an empty stomach, or anytime. */
export type FoodRule = "with_food" | "empty_stomach" | "anytime";

/** Scheduling frequency. */
export type Frequency = "everyday" | "specific_days" | "as_needed" | "interval";

/**
 * ISO weekday (1 = Monday … 7 = Sunday), matching JavaScript's getDay() after
 * remapping Sunday (0) to 7. Used by `specific_days` schedules.
 */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Which design accent palette an item uses (primary / secondary / …). */
export type Accent = "primary" | "secondary" | "tertiary" | "error";

/** Lifecycle status of a materialized dose instance. */
export type DoseStatus =
  | "scheduled"
  | "due"
  | "taken"
  | "skipped"
  | "snoozed"
  | "missed";

/** Coarse time-of-day bucket used to group doses in the timeline. */
export type Daypart = "morning" | "noon" | "evening" | "night";

/** User's primary goal, captured in onboarding step 1. */
export type PrimaryGoal = "never_miss" | "chronic" | "wellness";

/** How aggressively reminders should adapt, captured in onboarding step 2. */
export type ReminderStyle = "smart_adaptive" | "regular";

/** Relationship of an emergency contact, captured in onboarding step 7. */
export type Relationship = "spouse" | "child" | "friend" | "other" | "doctor";

/** Health condition tag, captured in onboarding step 3. */
export type ConditionTag =
  | "hypertension"
  | "diabetes_type_1"
  | "diabetes_type_2"
  | "asthma"
  | "cholesterol"
  | "heart_disease"
  | "anxiety"
  | "insomnia"
  | "arthritis"
  | "other";

/** Kind of local/push notification. */
export type NotificationKind =
  | "dose_reminder"
  | "dose_due"
  | "dose_missed"
  | "refill_low"
  | "streak"
  | "system";
