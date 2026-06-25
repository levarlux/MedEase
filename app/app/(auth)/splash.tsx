import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Icon } from "@/components/Icon";

/**
 * Splash screen.
 *
 * Pixel-faithful port of splash_screen/code.html: two ambient glow blobs,
 * a white rounded-square logo container with a filled medical icon
 * overlaid with a small heart, the "MediFlow" wordmark, tagline,
 * and an animated loading bar. Auto-advances to login after ~2.8s.
 */
export default function Splash() {
  const barWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barWidth, {
      toValue: 1,
      duration: 2400,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
    const t = setTimeout(() => router.replace("/(auth)/login"), 2800);
    return () => clearTimeout(t);
  }, [barWidth]);

  const width = barWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View className="flex-1 items-center justify-center bg-background px-md relative overflow-hidden">
      {/* Ambient glow blobs */}
      <View className="absolute -top-20 -left-16 w-72 h-72 rounded-full bg-primary-container/30 blur-3xl" />
      <View className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl" />

      <View className="items-center">
        {/* Logo container */}
        <View
          className="w-32 h-32 rounded-[32px] bg-surface-container-lowest items-center justify-center shadow-clinical relative"
          style={{ shadowColor: "#146a5c" }}
        >
          <Icon name="medical" size={72} color="#146a5c" fill />
          <View className="absolute inset-0 items-center justify-center">
            <Icon name="heart" size={20} color="#ffffff" fill />
          </View>
        </View>

        {/* Wordmark */}
        <Text className="mt-lg text-[34px] leading-[44px] font-bold text-primary tracking-tight">
          MediFlow
        </Text>
        <Text className="mt-1 text-body-md text-on-surface-variant">
          Harmonizing your health, one step at a time.
        </Text>

        {/* Loading bar */}
        <View className="mt-xl w-[200px] h-1 bg-surface-container-highest rounded-full overflow-hidden">
          <Animated.View className="h-full bg-primary rounded-full" style={{ width }} />
        </View>
        <Text className="mt-3 text-label-sm text-outline">Initializing Secure Vault</Text>
      </View>

      {/* Footer */}
      <View className="absolute bottom-10 items-center">
        <View className="flex-row items-center gap-1">
          <Icon name="shield-checkmark" size={14} color="#6f7976" />
          <Text className="text-label-sm text-outline">
            End-to-End Encrypted Health Data
          </Text>
        </View>
        <Text className="mt-1 text-label-sm text-outline-variant">v2.4.0 Clinical Core</Text>
      </View>
    </View>
  );
}
