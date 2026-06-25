import { Text, View } from "react-native";
import { Icon } from "./Icon";

export interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * Generic empty/placeholder state.
 * Shown when a screen has no data yet (no meds, no doses today, etc.).
 */
export function EmptyState({ icon, title, subtitle, children }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-xl py-xl">
      <View className="w-16 h-16 rounded-full bg-surface-container-high items-center justify-center mb-md">
        <Icon name={icon} size={32} color="#6f7976" />
      </View>
      <Text className="text-headline-md font-semibold text-on-surface text-center">
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-1 text-body-md text-on-surface-variant text-center">
          {subtitle}
        </Text>
      )}
      {children && <View className="mt-lg">{children}</View>}
    </View>
  );
}
