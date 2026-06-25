import { Text, View } from "react-native";

export default function OnboardingScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-md">
      <Text className="text-headline-lg font-bold text-primary">Onboarding</Text>
      <Text className="mt-2 text-body-md text-on-surface-variant text-center">
        9-step personalized setup flow will render here.
      </Text>
    </View>
  );
}
