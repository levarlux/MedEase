import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { useKindeAuth } from "@kinde/expo";
import { Icon } from "@/components/Icon";
import { LabeledInput } from "@/components/LabeledInput";
import { PillButton } from "@/components/PillButton";

/**
 * Login / Sign-in screen.
 *
 * Pixel-faithful port of login_signup/code.html: ambient glow blobs, brand
 * header (logo badge + wordmark + subtitle), an auth card with email/password
 * fields, social-login buttons (Google / Apple ID), and a "create account"
 * footer link.
 *
 * Auth powered by Kinde — calls kinde.login() for OAuth and kinde.register()
 * for sign-up. Convex session is handled upstream by ConvexProviderWithAuth.
 */
export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kinde = useKindeAuth();

  /** OAuth sign-in (shared by Google and Apple buttons). */
  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      setIsSubmitting(true);
      // Kinde's login() opens the browser for OAuth. The deep link callback
      // redirects back to the app where the session is established.
      await kinde.login({
        authUrlParams: {
          connection: provider,
        },
      });
      // After successful auth, Convex provider auto-syncs the JWT and the
      // session gate in index.tsx will route to onboarding or tabs.
    } catch (err) {
      Alert.alert("Sign-in failed", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Email/password sign-in (Kinde supports this if configured). */
  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Missing password", "Please enter your password.");
      return;
    }
    try {
      setIsSubmitting(true);
      // Kinde's login() also handles email/password flows — the SDK detects
      // the login_type from the Kinde dashboard configuration.
      await kinde.login();
    } catch (err) {
      Alert.alert("Sign-in failed", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Navigate to registration screen. */
  const goToSignUp = () => {
    router.push("/(auth)/register" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-1 relative"
        keyboardShouldPersistTaps="handled"
      >
        {/* Ambient glow */}
        <View className="absolute -top-16 -right-20 w-72 h-72 rounded-full bg-primary-fixed/20 blur-3xl" />
        <View className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-secondary-fixed/20 blur-3xl" />

        <View className="flex-1 px-md justify-center">
          {/* Brand header */}
          <View className="items-center mb-xl">
            <View className="w-16 h-16 rounded-[20px] bg-primary-container items-center justify-center shadow-clinical">
              <Icon name="medical" size={32} color="#005c4f" fill />
            </View>
            <Text className="mt-3 text-headline-lg font-bold text-primary">
              MediFlow
            </Text>
            <Text className="mt-1 text-label-lg text-on-surface-variant text-center px-lg">
              Your intelligent companion for seamless medication management.
            </Text>
          </View>

          {/* Auth card */}
          <View className="bg-surface-container-lowest rounded-[32px] p-lg shadow-clinical">
            <Text className="text-headline-md font-semibold text-on-surface">
              Welcome back
            </Text>
            <Text className="mt-1 text-body-md text-on-surface-variant">
              Sign in to continue your wellness journey
            </Text>

            <View className="mt-lg gap-md">
              <LabeledInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                leadingIcon="mail"
              />

              <LabeledInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leadingIcon="lock-closed"
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={8}
                  >
                    <Icon
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#6f7976"
                    />
                  </Pressable>
                }
              />

              <Pressable
                className="self-end"
                onPress={() => {
                  /* TODO: forgot password — kinde.resetPassword() */
                }}
              >
                <Text className="text-label-lg text-primary font-semibold">
                  Forgot password?
                </Text>
              </Pressable>

              <PillButton
                label="Sign In"
                onPress={handleSignIn}
                loading={isSubmitting}
              />
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-lg">
              <View className="flex-1 h-px bg-outline-variant" />
              <Text className="mx-md text-label-sm text-outline tracking-widest">
                OR CONTINUE WITH
              </Text>
              <View className="flex-1 h-px bg-outline-variant" />
            </View>

            {/* Social buttons */}
            <View className="flex-row gap-md">
              <Pressable
                className="flex-1 h-12 rounded-full flex-row items-center justify-center gap-2 border border-outline-variant active:opacity-70"
                onPress={() => handleOAuth("google")}
                disabled={isSubmitting}
              >
                <Icon name="logo-google" size={18} color="#191c1d" />
                <Text className="text-label-lg text-on-surface font-semibold">
                  Google
                </Text>
              </Pressable>
              <Pressable
                className="flex-1 h-12 rounded-full flex-row items-center justify-center gap-2 bg-on-surface active:opacity-70"
                onPress={() => handleOAuth("apple")}
                disabled={isSubmitting}
              >
                <Icon name="logo-apple" size={18} color="#f8f9fa" />
                <Text className="text-label-lg text-surface font-semibold">
                  Apple ID
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <View className="flex-row items-center justify-center mt-lg">
            <Text className="text-body-md text-on-surface-variant">
              New to MediFlow?{" "}
            </Text>
            <Pressable onPress={goToSignUp}>
              <Text className="text-body-md text-primary font-bold">
                Create an account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
