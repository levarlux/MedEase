/**
 * MediFlow — shared domain model types.
 *
 * These interfaces describe the shape of every row in the Convex tables
 * (convex/schema.ts) plus the value-object types the engine produces and the
 * onboarding flow collects. They are pure types — no runtime values.
 */

import type {
  Accent,
  ConditionTag,
  Daypart,
  DoseStatus,
  FoodRule,
  Frequency,
  MedForm,
  PrimaryGoal,
  ReminderStyle,
  Relationship,
  StrengthUnit,
  Weekday,
} from "./enums";

/** Strength is a value + unit pair (e.g. 500 mg). */
export interface Strength {
  value: number;
  unit: StrengthUnit;
}

/** User profile row — one per authenticated user. */
export interface Profile {
  tokenIdentifier: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  primaryGoal: PrimaryGoal | null;
  reminderStyle: ReminderStyle;
  medicationForms: MedForm[];
  conditions: ConditionTag[];
  onboardingCompleted: boolean;
  memberSince: string; // ISO date
}

/** Emergency contact captured in onboarding step 7. */
export interface EmergencyContact {
  tokenIdentifier: string;
  name: string;
  relationship: Relationship;
  phone: string;
}

/** Preferred pharmacy captured in onboarding step 8. */
export interface Pharmacy {
  tokenIdentifier: string;
  name: string;
  address: string;
  distanceMiles: number | null;
}

/** A medication in the user's library — schedule definition lives here. */
export interface Medication {
  tokenIdentifier: string;

  name: string;
  strengthValue: number;
  strengthUnit: StrengthUnit;
  form: MedForm;
  foodRule: FoodRule;
  instructions?: string;

  // --- schedule ---
  frequency: Frequency;
  weekdays: Weekday[];
  times: string[]; // "HH:MM" 24h
  intervalHours: number | null;

  // --- safety constraints (drive the adaptive engine) ---
  minSpacingHours: number;
  dailyMax: number;
  missedAfterMinutes: number;

  // --- inventory / refill ---
  refillEnabled: boolean;
  totalQuantity: number;
  currentQuantity: number;
  refillThreshold: number;

  // --- presentation ---
  accent: Accent;
  icon: string;

  // --- lifecycle ---
  startDate: string; // ISO date
  endDate: string | null;
  active: boolean;
}

/** One concrete materialized dose, generated from a Medication's schedule. */
export interface DoseInstance {
  tokenIdentifier: string;
  medicationId: string;

  scheduledAt: number; // epoch ms — sortable, timezone-safe
  daypart: Daypart;
  status: DoseStatus;

  takenQty: number | null;
  takenAt: number | null; // epoch ms
  snoozedUntil: number | null; // epoch ms
  missedAdvice: MissedAdvice | null;
}

/** Safety advice computed when a dose transitions to "missed". */
export interface MissedAdvice {
  action: "take_now" | "skip";
  message: string;
  nextDoseAt: number | null; // epoch ms
}

/** Immutable audit-log row. Appended on every take/skip/snooze/miss. */
export interface DoseEvent {
  tokenIdentifier: string;
  doseInstanceId: string;
  medicationId: string;
  kind: "taken" | "skipped" | "snoozed" | "unsnoozed" | "missed";
  quantity: number | null;
  at: number; // epoch ms
  note?: string;
}

/** Per-user app settings (notification behavior + security). */
export interface Settings {
  tokenIdentifier: string;

  // notifications
  smartReminders: boolean;
  criticalSound: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
  leadTimeMinutes: number;
  snoozeMinutes: number;

  // security
  twoFactorEnabled: boolean;
  biometricUnlock: boolean;
}

/** Payload collected by the onboarding flow before writing to the backend. */
export interface OnboardingPayload {
  primaryGoal: PrimaryGoal;
  reminderStyle: ReminderStyle;
  conditions: ConditionTag[];
  medicationForms: MedForm[];
  emergencyContact: EmergencyContact;
  pharmacy: Pharmacy;
}

/** Engine output: a generated dose slot (pre-persistence). */
export interface MaterializedDose {
  scheduledAt: number;
  daypart: Daypart;
  medicationId: string;
}

/** Engine input: the slice of a Medication the scheduler needs. */
export interface ScheduleInput {
  id: string;
  frequency: Frequency;
  weekdays: Weekday[];
  times: string[];
  intervalHours: number | null;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

/** Insights: one day's adherence summary. */
export interface DayAdherence {
  date: string; // YYYY-MM-DD
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  pending: number;
  percent: number;
}

/** Insights: per-medication adherence row. */
export interface MedAdherence {
  medicationId: string;
  name: string;
  scheduleLabel: string;
  adherencePct: number | null;
  accent: Accent;
  icon: string;
  currentQuantity: number;
  totalQuantity: number;
  refillThreshold: number;
  refillEnabled: boolean;
}
