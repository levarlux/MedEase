import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useQuery } from "convex/react";
import { TopAppBar, AdherenceRing, EmptyState } from "@/components";
import { Icon } from "@/components/Icon";
import { api } from "@convex/_generated/api";

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
const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * Insights & Reports screen.
 *
 * Shows:
 *   - Overall 7-day adherence ring + streak
 *   - 7-day bar chart (taken / total)
 *   - Per-medication adherence rows
 */
export default function InsightsScreen() {
  // Compute local tz offset once.
  const tzOffsetMs = useMemo(() => -new Date().getTimezoneOffset() * 60 * 1000, []);

  const range = useQuery(api.insights.getRange, { days: 7, tzOffsetMs });
  const medAdherence = useQuery(api.insights.getMedAdherence, { days: 30 });
  const streak = useQuery(api.insights.getStreak, { tzOffsetMs });

  const loading = range === undefined || medAdherence === undefined || streak === undefined;

  // Overall percent across the 7-day window.
  const overall = useMemo(() => {
    if (!range || range.length === 0) return { percent: 0, taken: 0, total: 0 };
    const taken = range.reduce((s, d) => s + d.taken, 0);
    const total = range.reduce((s, d) => s + d.taken + d.skipped + d.missed + d.pending, 0);
    return {
      percent: total === 0 ? 0 : Math.round((taken / total) * 100),
      taken,
      total,
    };
  }, [range]);

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-md">
        <Text className="text-headline-md font-semibold text-on-surface px-sm mt-sm mb-md">
          Insights
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#146a5c" className="mt-xl" />
        ) : overall.total === 0 && medAdherence.length === 0 ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No data yet"
            subtitle="Take a few doses to see your adherence trends here."
          />
        ) : (
          <View className="gap-md">
            {/* Hero: overall + streak */}
            <View className="flex-row items-center gap-md p-md bg-surface-container-lowest rounded-3xl shadow-clinical">
              <View className="flex-1 items-center">
                <AdherenceRing percent={overall.percent} size={110} label="7-day" />
              </View>
              <View className="flex-1 items-center">
                <View className="w-20 h-20 rounded-full bg-tertiary-container items-center justify-center">
                  <Text className="text-[28px] font-bold text-on-tertiary-container">
                    {streak.streak}
                  </Text>
                </View>
                <Text className="text-label-sm text-on-surface-variant mt-1">
                  day streak 🔥
                </Text>
              </View>
            </View>

            {/* 7-day bar chart */}
            <View className="p-md bg-surface-container-lowest rounded-2xl">
              <Text className="text-label-lg font-semibold text-on-surface mb-sm">
                Last 7 Days
              </Text>
              <View className="flex-row justify-between items-end h-32">
                {range && range.length > 0 ? (
                  range.map((day, i) => {
                    const barHeight = Math.max(4, (day.percent / 100) * 80);
                    const isMissed = day.missed > 0;
                    return (
                      <View key={i} className="flex-1 items-center mx-0.5">
                        <Text className="text-[9px] text-on-surface-variant mb-1">
                          {day.percent}%
                        </Text>
                        <View
                          className={`w-6 rounded-t-md ${isMissed ? "bg-error/60" : "bg-primary"}`}
                          style={{ height: barHeight }}
                        />
                        <Text className="text-[9px] text-on-surface-variant mt-1">
                          {WEEKDAY_SHORT[new Date(day.date + "T00:00:00").getDay()]}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text className="text-label-sm text-on-surface-variant">
                    No data in range
                  </Text>
                )}
              </View>
            </View>

            {/* Per-medication adherence */}
            <View>
              <Text className="text-label-lg font-semibold text-on-surface px-sm mb-sm">
                Medications
              </Text>
              <View className="gap-sm">
                {medAdherence.map((med) => {
                  const accentBg = ACCENT_BG[med.accent] ?? "bg-primary-container";
                  const accentIcon = ACCENT_ICON[med.accent] ?? "#005c4f";
                  const stockPct =
                    med.refillEnabled && med.totalQuantity > 0
                      ? Math.round((med.currentQuantity / med.totalQuantity) * 100)
                      : null;
                  const isLow = stockPct !== null && stockPct <= med.refillThreshold;

                  return (
                    <View
                      key={med.medicationId}
                      className="flex-row items-center gap-md p-md bg-surface-container-lowest rounded-2xl"
                    >
                      <View className={`w-10 h-10 rounded-xl items-center justify-center ${accentBg}`}>
                        <Icon name={med.icon} size={20} color={accentIcon} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-body-md font-semibold text-on-surface" numberOfLines={1}>
                          {med.name}
                        </Text>
                        <Text className="text-label-sm text-on-surface-variant">
                          {med.scheduleLabel}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text
                          className={`text-body-md font-bold ${
                            med.adherencePct === null
                              ? "text-on-surface-variant"
                              : med.adherencePct >= 80
                                ? "text-primary"
                                : med.adherencePct >= 50
                                  ? "text-tertiary"
                                  : "text-error"
                          }`}
                        >
                          {med.adherencePct === null ? "—" : `${med.adherencePct}%`}
                        </Text>
                        {isLow && (
                          <Text className="text-[10px] text-error">Refill low</Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
