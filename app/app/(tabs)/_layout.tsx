import { Tabs } from "expo-router";
import { BottomNav } from "@/components/BottomNav";

/**
 * Main app tabs. The four screens declared here match the floating nav
 * pill in the prototypes: Home / Schedule / Meds / Insights. We render a
 * custom tabBar (BottomNav) so the styling is pixel-faithful instead of the
 * default React Navigation bar.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="schedule" options={{ title: "Schedule" }} />
      <Tabs.Screen name="meds" options={{ title: "Meds" }} />
      <Tabs.Screen name="insights" options={{ title: "Insights" }} />
    </Tabs>
  );
}
