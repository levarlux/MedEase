import { Pressable, Text, View } from "react-native";
import { Icon } from "./Icon";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

export interface TopAppBarProps {
  /** Override the default greeting. */
  greeting?: string;
  /** Left-side action (e.g. back button). Replaces avatar. */
  leftAction?: React.ReactNode;
  /** Called when the notifications bell is pressed. */
  onNotificationsPress?: () => void;
}

/**
 * Standard top app bar used across dashboard, schedule, meds, insights, and
 * profile screens. The avatar taps through to the profile screen.
 */
export function TopAppBar({
  greeting,
  leftAction,
  onNotificationsPress,
}: TopAppBarProps) {
  return (
    <SafeAreaView edges={["top"]}>
      <View className="h-16 flex-row items-center px-md bg-background/80">
        {leftAction ?? (
          <Pressable
            onPress={() => router.push("/profile")}
            className="flex-row items-center gap-2 flex-1 active:opacity-70"
          >
            {/* Avatar placeholder — real avatar comes from profile store */}
            <View className="w-10 h-10 rounded-full border-2 border-primary-container bg-surface-container items-center justify-center">
              <Icon name="person-outline" size={20} color="#86d2c1" />
            </View>
            <View>
              <Text className="text-[16px] font-semibold text-primary leading-tight">
                MediFlow
              </Text>
              <Text className="text-[12px] text-on-surface-variant leading-tight">
                {greeting ?? "Your health companion"}
              </Text>
            </View>
          </Pressable>
        )}
        <Pressable
          onPress={onNotificationsPress}
          className="w-10 h-10 rounded-full bg-surface-container-low items-center justify-center active:opacity-70"
          hitSlop={8}
        >
          <Icon name="notifications-outline" size={20} color="#146a5c" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
