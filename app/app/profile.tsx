import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { api } from "@convex/_generated/api";
import { useKindeAuth } from "@kinde/expo";

/**
 * Settings row with a trailing toggle.
 */
function ToggleRow({
  icon,
  label,
  subtitle,
  value,
  onToggle,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View className="flex-row items-center gap-md p-md bg-surface-container-lowest">
      <View className="w-9 h-9 rounded-full bg-surface-container items-center justify-center">
        <Icon name={icon} size={18} color="#146a5c" />
      </View>
      <View className="flex-1">
        <Text className="text-body-md font-medium text-on-surface">{label}</Text>
        {subtitle && (
          <Text className="text-label-sm text-on-surface-variant">{subtitle}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#bec9c5", true: "#146a5c" }}
      />
    </View>
  );
}

/**
 * Profile & Settings screen.
 *
 * Shows the user's profile card + grouped settings (notifications, security).
 * All toggles are wired to Convex settings.update.
 */
export default function ProfileScreen() {
  const session = useQuery(api.users.getCurrent);
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);
  const kinde = useKindeAuth();
  const [signingOut, setSigningOut] = useState(false);

  if (session === undefined || settings === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#146a5c" />
      </View>
    );
  }

  if (session === null || !session.exists) {
    // Should not happen (session gate redirects), but be safe.
    return (
      <View className="flex-1 bg-background items-center justify-center px-md">
        <Text className="text-body-md text-on-surface-variant">
          Please sign in to view your profile.
        </Text>
      </View>
    );
  }

  const profile = session.profile;

  const handleToggle = (key: string, value: boolean) => {
    updateSettings({ [key]: value }).catch((err) => {
      Alert.alert("Update failed", (err as Error).message);
    });
  };

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await kinde.logout();
    } catch (err) {
      Alert.alert("Sign out failed", (err as Error).message);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-md gap-md">
        {/* Header */}
        <View className="flex-row items-center justify-between py-sm">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Icon name="chevron-back" size={26} color="#146a5c" />
          </Pressable>
          <Text className="text-headline-md font-semibold text-on-surface">
            Profile
          </Text>
          <View className="w-6" />
        </View>

        {/* Profile card */}
        <View className="flex-row items-center gap-md p-lg bg-surface-container-lowest rounded-3xl shadow-clinical">
          <View className="w-16 h-16 rounded-full bg-primary-container items-center justify-center">
            {profile.avatarUrl ? null : (
              <Icon name="person" size={32} color="#005c4f" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-headline-md font-semibold text-on-surface">
              {profile.fullName}
            </Text>
            <Text className="text-body-md text-on-surface-variant">
              {profile.email}
            </Text>
            <Text className="text-label-sm text-outline mt-1">
              Member since {new Date(profile.memberSince).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Notifications group */}
        <View>
          <Text className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wider px-sm mb-sm">
            Notifications
          </Text>
          <View className="gap-px rounded-2xl overflow-hidden">
            <ToggleRow
              icon="bulb-outline"
              label="Smart Reminders"
              subtitle="Adaptive timing based on your habits"
              value={settings?.smartReminders ?? false}
              onToggle={(v) => handleToggle("smartReminders", v)}
            />
            <ToggleRow
              icon="volume-high-outline"
              label="Critical Sound"
              subtitle="Override silent/DND for med alerts"
              value={settings?.criticalSound ?? false}
              onToggle={(v) => handleToggle("criticalSound", v)}
            />
            <ToggleRow
              icon="time-outline"
              label="Lead Time"
              subtitle={`Remind ${settings?.leadTimeMinutes ?? 0} min before`}
              value={(settings?.leadTimeMinutes ?? 0) > 0}
              onToggle={(v) => updateSettings({ leadTimeMinutes: v ? 5 : 0 })}
            />
          </View>
        </View>

        {/* Security group */}
        <View>
          <Text className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wider px-sm mb-sm">
            Security
          </Text>
          <View className="gap-px rounded-2xl overflow-hidden">
            <ToggleRow
              icon="lock-closed-outline"
              label="Two-Factor Auth"
              subtitle="Require code on new devices"
              value={settings?.twoFactorEnabled ?? false}
              onToggle={(v) => handleToggle("twoFactorEnabled", v)}
            />
            <ToggleRow
              icon="finger-print-outline"
              label="Biometric Unlock"
              subtitle="Face ID / fingerprint"
              value={settings?.biometricUnlock ?? false}
              onToggle={(v) => handleToggle("biometricUnlock", v)}
            />
          </View>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          disabled={signingOut}
          className="flex-row items-center justify-center gap-2 p-md bg-error-container rounded-2xl active:opacity-80"
        >
          <Icon name="log-out-outline" size={20} color="#93000a" />
          <Text className="text-body-md font-semibold text-error">
            {signingOut ? "Signing out…" : "Sign Out"}
          </Text>
        </Pressable>

        <Text className="text-label-sm text-outline-variant text-center mt-md">
          MediFlow v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
