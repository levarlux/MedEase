import { Redirect } from "expo-router";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { useEffect, useRef } from "react";

/**
 * Entry route — session gate.
 *
 * Reads the server-side session state from `users.getCurrent` and routes:
 *   - null          → not authenticated → splash → login
 *   - {exists:false}→ authenticated but no profile → bootstrap → onboarding
 *   - {exists:true} → fully set up → main tabs
 *
 * The bootstrap action is idempotent — calling it on every render when the
 * user lacks a profile is safe. A ref guard ensures we only fire it once.
 */
export default function Index() {
  const session = useQuery(api.users.getCurrent);
  const bootstrap = useAction(api.auth.bootstrap);
  const bootstrapped = useRef(false);

  // When user is authenticated but has no profile, create one.
  useEffect(() => {
    if (session && !session.exists && !bootstrapped.current) {
      bootstrapped.current = true;
      bootstrap({})
        .then(() => {
          // Profile created — getCurrent query will re-fetch and flip exists:true.
        })
        .catch(() => {
          // If it fails (e.g. transient network), allow retry by resetting.
          bootstrapped.current = false;
        });
    }
  }, [session, bootstrap]);

  // Still loading the session; show nothing (splash is visible via
  // expo-splash-screen until fonts + initial auth check resolve).
  if (session === undefined) {
    return null;
  }

  if (session === null) {
    // Not authenticated — go to splash → login flow.
    return <Redirect href="/(auth)/splash" />;
  }

  if (!session.exists) {
    // Authenticated but no profile yet — bootstrap in progress.
    // Return null while getCurrent re-fetches and flips exists to true.
    return null;
  }

  // Fully onboarded → main app.
  return <Redirect href="/(tabs)" />;
}

