import { ConvexReactClient } from "convex/react";

/**
 * Single shared Convex client instance.
 *
 * The URL is a public, embeddable value (it's the client API endpoint, not a
 * secret). EXPO_PUBLIC_ prefix exposes it to the RN bundle.
 */
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,
  { unsavedChangesWarning: false },
);
