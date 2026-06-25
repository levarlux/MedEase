import "../global.css";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { KindeAuthProvider } from "@kinde/expo";
import { ConvexProviderWithAuth } from "convex/react";
import { convex } from "@/lib/convex";
import { useKindeConvexAuth } from "@/lib/kindeAuth";

export {
  // Catch any errors thrown by the deepest children.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(auth)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()
  .catch(() => {
    /* already prevented — fine */
  });

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // expo-google-fonts ships named exports; load every Manrope weight the
    // design system uses (400, 500, 600, 700, 800).
    Manrope: require("@expo-google-fonts/manrope/Manrope_400Regular.ttf"),
    Manrope_500Medium: require("@expo-google-fonts/manrope/Manrope_500Medium.ttf"),
    Manrope_600SemiBold: require("@expo-google-fonts/manrope/Manrope_600SemiBold.ttf"),
    Manrope_700Bold: require("@expo-google-fonts/manrope/Manrope_700Bold.ttf"),
    Manrope_800ExtraBold: require("@expo-google-fonts/manrope/Manrope_800ExtraBold.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <KindeAuthProvider
      config={{
        domain: process.env.EXPO_PUBLIC_KINDE_DOMAIN,
        clientId: process.env.EXPO_PUBLIC_KINDE_CLIENT_ID,
      }}
    >
      <ConvexProviderWithAuth client={convex} useAuth={useKindeConvexAuth}>
        <ThemeProvider value={DefaultTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#f8f9fa" },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen name="meds/add" options={{ presentation: "modal" }} />
            <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
            <Stack.Screen name="profile" />
          </Stack>
        </ThemeProvider>
      </ConvexProviderWithAuth>
    </KindeAuthProvider>
  );
}
