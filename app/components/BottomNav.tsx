import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Platform, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./Icon";

interface TabItem {
  route: string;
  label: string;
  icon: string;
}

const TABS: TabItem[] = [
  { route: "index", label: "Home", icon: "home-outline" },
  { route: "schedule", label: "Schedule", icon: "calendar-outline" },
  { route: "meds", label: "Meds", icon: "medical-outline" },
  { route: "insights", label: "Insights", icon: "bar-chart-outline" },
];

/**
 * Floating pill-shaped bottom navigation.
 *
 * Pixel-faithful port of the design system spec:
 *   - 90% width, centered, floating 24px from bottom
 *   - Dark bg (inverse-surface/90) + backdrop blur
 *   - 4 tabs; active = expanded pill with filled icon + label,
 *     inactive = icon-only at muted tint
 */
export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const currentRoute = state.routes[state.index]?.name;

  return (
    <SafeAreaView edges={["bottom"]} className="absolute bottom-0 left-0 right-0 items-center pb-3">
      <View className="w-[90%] max-w-md">
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={80}
            tint="dark"
            className="rounded-full overflow-hidden shadow-nav-pill"
          >
            <TabBarContent
              currentRoute={currentRoute}
              state={state}
              navigation={navigation}
              descriptors={descriptors}
            />
          </BlurView>
        ) : (
          <View className="bg-inverse-surface/90 rounded-full overflow-hidden shadow-nav-pill">
            <TabBarContent
              currentRoute={currentRoute}
              state={state}
              navigation={navigation}
              descriptors={descriptors}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function TabBarContent({
  currentRoute,
  state,
  navigation,
}: Pick<BottomTabBarProps, "state" | "navigation" | "descriptors"> & {
  currentRoute: string;
}) {
  return (
    <View className="flex-row items-center py-2 px-2 gap-1">
      {TABS.map((tab) => {
        const isFocused = currentRoute === tab.label ||
          currentRoute === tab.route;

        const onPress = () => {
          const route = state.routes.find((r) =>
            r.name === tab.label || r.name === tab.route
          );
          if (route) {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.key, route.params);
            }
          }
        };

        if (isFocused) {
          return (
            <Pressable
              key={tab.route}
              onPress={onPress}
              className="flex-1 flex-row items-center justify-center gap-2 py-2 rounded-full bg-surface-container-lowest"
            >
              <Icon name={tab.icon} size={20} color="#146a5c" fill />
              <Text className="text-label-sm text-on-background font-semibold">
                {tab.label}
              </Text>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.route}
            onPress={onPress}
            className="flex-1 py-2 items-center"
          >
            <Icon name={tab.icon} size={20} color="#86d2c1" />
          </Pressable>
        );
      })}
    </View>
  );
}
