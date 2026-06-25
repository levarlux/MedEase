/**
 * MediFlow shared package — barrel export.
 *
 * Import from `@mediflow/shared`. The app's tsconfig maps that specifier to
 * this directory (../shared/src), and Convex duplicates the engine logic in
 * convex/doses.ts because its bundler can't resolve workspace packages.
 */

export * from "./enums";
export * from "./types";
export * from "./time";
export * from "./presentation";
export {
  generateSlots,
  resolveDoseStatus,
  computeMissedAdvice,
  computeDayAdherence,
  computeOverallAdherence,
  computeStreak,
  canTakeNow,
} from "./engine";
