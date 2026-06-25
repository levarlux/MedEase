import type { AuthConfig } from "convex/server";

/**
 * Convex auth config for Kinde (OIDC).
 *
 * Kinde issues standard OpenID Connect JWTs, so the simple provider form
 * applies: Convex fetches {domain}/.well-known/openid-configuration to
 * discover the JWKS endpoint automatically.
 *
 * - domain: must exactly match the JWT `iss` claim.
 * - applicationID: must exactly match the JWT `aud` claim. Configured as the
 *   Convex deployment URL in the Kinde API settings. If you used a different
 *   API identifier in Kinde admin, update it here.
 *
 * Never omit applicationID: https://levarlux.kinde.com is a business-specific
 * issuer, but the audience check prevents cross-service token replay.
 */
export default {
  providers: [
    {
      domain: "https://levarlux.kinde.com",
      applicationID: "https://proficient-avocet-637.convex.cloud",
    },
  ],
} satisfies AuthConfig;
