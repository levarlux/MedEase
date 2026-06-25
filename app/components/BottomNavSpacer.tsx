import { View } from "react-native";

/**
 * Adds bottom padding to account for the floating BottomNav pill.
 * The nav is ~56px tall + 12px bottom safe area ≈ 68px.
 * Place this at the end of scrollable content or inside flex layouts
 * that sit behind the nav.
 */
export function BottomNavSpacer() {
  return <View className="h-24" />;
}
