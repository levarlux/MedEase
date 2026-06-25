import { Stack } from "expo-router";

/** Auth group: splash → login/signup. No headers, plain background. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
