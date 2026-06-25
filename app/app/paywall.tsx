import { Text, View } from "react-native";

export default function PaywallScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-md">
      <Text className="text-headline-lg font-bold text-primary">MediFlow Plus</Text>
      <Text className="mt-2 text-body-md text-on-surface-variant text-center">
        Premium paywall will render here.
      </Text>
    </View>
  );
}
