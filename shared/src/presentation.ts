/**
 * MediFlow — UI presentation mappings.
 *
 * Pure lookup tables mapping enum values to the Ionicons icon names and color
 * accents used across the app. Keeping these in the shared package means the
 * Add Medication wizard, the library, the dashboard, and insights all render
 * the same icon for a given medication form/accent/status.
 */

import type { Accent, Daypart, DoseStatus, MedForm } from "./enums";

/**
 * Ionicons icon name for each medication form. This is the icon persisted on
 * the Medication row (medications.icon) and rendered wherever a med appears.
 */
export const MED_FORM_ICON: Record<MedForm, string> = {
  pill: "medkit-outline",
  injection: "syringe-outline",
  liquid: "water-outline",
  other: "thermometer-outline",
};

/**
 * Accent palette suggestion per form. (The app currently persists accent as
 * "primary" for every med, but this lets future UI color-code by form.)
 */
export const MED_FORM_ACCENT: Record<MedForm, Accent> = {
  pill: "primary",
  injection: "secondary",
  liquid: "tertiary",
  other: "error",
};

/** Suggested accent per daypart — used for the timeline group headers. */
export const DAYPART_ACCENT: Record<Daypart, Accent> = {
  morning: "primary",
  noon: "tertiary",
  evening: "secondary",
  night: "error",
};

/** Ionicons icon for each dose action button. */
export const DOSE_ACTION_ICON = {
  take: "checkmark",
  snooze: "time-outline",
  skip: "close",
} as const;

/** Human label for each dose status — shown in the status chip. */
export const DOSE_STATUS_LABEL: Record<DoseStatus, string> = {
  scheduled: "Scheduled",
  due: "Due now",
  taken: "Taken",
  skipped: "Skipped",
  snoozed: "Snoozed",
  missed: "Missed",
};
