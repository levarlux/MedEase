import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Bootstrap a user profile on first authentication.
 *
 * Called from the client after Kinde login succeeds. If a profile row already
 * exists this is a no-op (idempotent). The Convex auth JWT must be attached
 * (ConvexProviderWithAuth handles this automatically).
 *
 * Returns the profile ID if created or found.
 */
export const bootstrap = action({
  args: {},
  handler: async (ctx): Promise<Id<"users">> => {
    const result: Id<"users"> = await ctx.runMutation(
      internal.users.ensureProfile,
      {},
    );
    return result;
  },
});

