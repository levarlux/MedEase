import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Cron scheduler for MediFlow.
 *
 * Runs every 15 minutes to:
 *   - Materialize upcoming dose slots for active medications.
 *   - Transition dose statuses (scheduled → due → missed).
 *
 * Uses the interval method per Convex guidelines.
 */
const crons = cronJobs();

// Materialize doses every 15 minutes.
crons.interval("materialize doses", { minutes: 15 }, internal.doses.materializeDoses, {});

export default crons;
