import { useMemo } from "react";
import { useKindeAuth } from "@kinde/expo";

/**
 * Bridges Kinde auth → Convex's ConvexProviderWithAuth `useAuth` contract.
 *
 * ConvexProviderWithAuth calls this hook on each render to decide whether to
 * attach a JWT to each request. We resolve a fresh access token from Kinde;
 * when Convex signals `forceRefreshToken` (the server rejected the old token)
 * we run Kinde's refresh flow first, then return the new token.
 *
 * Returning null from fetchAccessToken tells Convex the user is logged out.
 */
export function useKindeConvexAuth() {
  const kinde = useKindeAuth();

  return useMemo(
    () => ({
      isLoading: kinde.isLoading,
      isAuthenticated: kinde.isAuthenticated,
      fetchAccessToken: async ({
        forceRefreshToken,
      }: {
        forceRefreshToken: boolean;
      }): Promise<string | null> => {
        if (forceRefreshToken) {
          await kinde.refreshToken({
            domain: process.env.EXPO_PUBLIC_KINDE_DOMAIN!,
            clientId: process.env.EXPO_PUBLIC_KINDE_CLIENT_ID!,
          });
        }
        const token = await kinde.getAccessToken();
        return token ?? null;
      },
    }),
    [kinde],
  );
}
