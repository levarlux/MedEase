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
 * Registration screen.
 *
 * Similar layout to login.tsx but with a "Create Account" flow.
 * Uses Kinde's register() method to open the signup flow in the browser.
 * After successful registration, the session gate in index.tsx routes
 * to onboarding.
 */
export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kinde = useKindeAuth();

  /** OAuth sign-up (shared by Google and Apple buttons). */
  const handleOAuth = async (provider: "google" | "apple") => {
    try {
      setIsSubmitting(true);
      await kinde.register({
        authUrlParams: {
          connection: provider,
        },
      });
    } catch (err) {
      Alert.alert("Sign-up failed", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Email/password registration. */
  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert("Missing email", "Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Missing password", "Please enter a password.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await kinde.register();
    } catch (err) {
      Alert.alert("Sign-up failed", (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
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
              Create Account
            </Text>
            <Text className="mt-1 text-label-lg text-on-surface-variant text-center px-lg">
              Start your journey to better medication management.
            </Text>
          </View>

          {/* Auth card */}
          <View className="bg-surface-container-lowest rounded-[32px] p-lg shadow-clinical">
            <Text className="text-headline-md font-semibold text-on-surface">
              Get Started
            </Text>
            <Text className="mt-1 text-body-md text-on-surface-variant">
              Create your MediFlow account
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

              <LabeledInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                leadingIcon="lock-closed"
              />

              <PillButton label="Create Account" onPress={handleRegister} loading={isSubmitting} />
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
              Already have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/login")}>
              <Text className="text-body-md text-primary font-bold">Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
