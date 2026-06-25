import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Authorization helpers shared by all queries/mutations.
 *
 * The security model: every function derives the caller from
 * ctx.auth.getUserIdentity() and filters all data by tokenIdentifier.
 * Client-supplied userId/user identifiers are NEVER trusted for auth.
 */

export interface AuthIdentity {
  tokenIdentifier: string;
  email: string;
  name: string | null;
  pictureUrl: string | null;
}

/**
 * Resolve the authenticated identity, or throw if unauthenticated.
 * Use in mutations/actions that must have a logged-in user.
 */
export async function requireIdentity(
  ctx: QueryCtx | MutationCtx,
): Promise<AuthIdentity> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHENTICATED: sign in required.");
  }
  return {
    // tokenIdentifier is the canonical, stable per-user key from Kinde.
    tokenIdentifier: identity.tokenIdentifier,
    email: identity.email ?? "",
    name: identity.name ?? null,
    pictureUrl: (identity.pictureUrl as string | undefined) ?? null,
  };
}

/**
 * Resolve the authenticated user's Profile row, or throw.
 * For functions that need the profile to exist (post-onboarding).
 */
export async function requireUser(
  ctx: QueryCtx | MutationCtx,
): Promise<{ identity: AuthIdentity; profile: Doc<"users"> }> {
  const identity = await requireIdentity(ctx);
  const profile = await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND: complete onboarding first.");
  }
  return { identity, profile };
}

/**
 * Soft resolve: returns the profile if it exists, null otherwise.
 * Used by the session-gate query to decide routing.
 */
export async function getProfileOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  return await ctx.db
    .query("users")
    .withIndex("by_token_identifier", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
}
