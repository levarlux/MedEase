import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import { TopAppBar, EmptyState, PillButton } from "@/components";
import { Icon } from "@/components/Icon";
import { api } from "convex/_generated/api";

const ACCENT_BG: Record<string, string> = {
  primary: "bg-primary-container",
  secondary: "bg-secondary-container",
  tertiary: "bg-tertiary-container",
  error: "bg-error-container",
};

const ACCENT_ICON: Record<string, string> = {
  primary: "#005c4f",
  secondary: "#295982",
  tertiary: "#5a5118",
  error: "#93000a",
};

/**
 * Medication Library screen.
 *
 * Lists all of the user's medications as cards with icon, name, strength,
 * schedule label, and an inventory ring (current / total). Tapping a card
 * could open an edit sheet (TODO). The FAB at the bottom opens the Add
 * Medication wizard.
 */
export default function MedsScreen() {
  const meds = useQuery(api.medications.list, { activeOnly: true });

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-md">
        <View className="flex-row items-center justify-between mt-sm mb-md">
          <Text className="text-headline-md font-semibold text-on-surface">
            Medications
          </Text>
          <Pressable
            onPress={() => router.push("/meds/add")}
            className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-80"
          >
            <Icon name="add" size={22} color="#ffffff" />
          </Pressable>
        </View>

        {meds === undefined ? (
          <ActivityIndicator size="large" color="#146a5c" className="mt-xl" />
        ) : meds.length === 0 ? (
          <EmptyState
            icon="medkit-outline"
            title="No medications yet"
            subtitle="Add your first medication to start tracking doses and refills."
          >
            <PillButton
              label="Add Medication"
              icon="add"
              iconPosition="left"
              onPress={() => router.push("/meds/add")}
            />
          </EmptyState>
        ) : (
          <View className="gap-sm">
            {meds.map((med) => {
              const accentBg = ACCENT_BG[med.accent] ?? "bg-primary-container";
              const accentIcon = ACCENT_ICON[med.accent] ?? "#005c4f";
              const stockPct =
                med.refillEnabled && med.totalQuantity > 0
                  ? Math.round((med.currentQuantity / med.totalQuantity) * 100)
                  : null;
              const isLow = stockPct !== null && stockPct <= med.refillThreshold;

              const scheduleLabel =
                med.frequency === "everyday"
                  ? med.times.length > 1
                    ? `${med.times.length}× daily`
                    : "Daily"
                  : med.frequency === "specific_days"
                    ? `${med.weekdays.length}× weekly`
                    : med.frequency === "interval"
                      ? `Every ${med.intervalHours ?? 0}h`
                      : "As needed";

              return (
                <Pressable
                  key={med._id}
                  className="flex-row items-center gap-md p-md bg-surface-container-lowest rounded-2xl active:opacity-90"
                >
                  <View className={`w-12 h-12 rounded-xl items-center justify-center ${accentBg}`}>
                    <Icon name={med.icon} size={24} color={accentIcon} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body-md font-semibold text-on-surface" numberOfLines={1}>
                      {med.name}
                    </Text>
                    <Text className="text-label-sm text-on-surface-variant">
                      {med.strengthValue} {med.strengthUnit} · {scheduleLabel}
                    </Text>
                    {med.instructions && (
                      <Text className="text-[11px] text-outline mt-0.5" numberOfLines={1}>
                        {med.instructions}
                      </Text>
                    )}
                  </View>

                  {/* Stock indicator */}
                  {stockPct !== null && (
                    <View className="items-end">
                      <View className="w-10 h-10 rounded-full items-center justify-center border-2"
                        style={{
                          borderColor: isLow ? "#ba1a1a" : "#146a5c",
                        }}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isLow ? "text-error" : "text-primary"
                          }`}
                        >
                          {stockPct}%
                        </Text>
                      </View>
                      <Text className="text-[9px] text-on-surface-variant mt-0.5">
                        {isLow ? "Low" : "Stock"}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
