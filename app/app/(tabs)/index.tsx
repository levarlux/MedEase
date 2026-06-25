import { useMemo } from "react";
import { ScrollView, Text, View, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery, useMutation } from "convex/react";
import { useState, useCallback } from "react";
import { TopAppBar, AdherenceRing, DoseCard, EmptyState, PillButton } from "@/components";
import { api } from "@convex/_generated/api";
import { router } from "expo-router";
import { DAYPART_ORDER, DAYPART_LABEL } from "@mediflow/shared";
import type { Daypart } from "@mediflow/shared";

/**
 * Dashboard / Home screen.
 *
 * Shows today's adherence ring + a vertical timeline of doses grouped by
 * daypart (Morning / Noon / Evening / Night). Each unresolved dose has
 * take / snooze / skip actions wired to the Convex mutations.
 */
export default function HomeScreen() {
  const doses = useQuery(api.doses.listToday);
  const takeDose = useMutation(api.doses.takeDose);
  const skipDose = useMutation(api.doses.skipDose);
  const snoozeDose = useMutation(api.doses.snoozeDose);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex queries auto-refetch; this just toggles the spinner briefly.
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Compute adherence from the doses.
  const { percent, taken, total, byDaypart } = useMemo(() => {
    if (!doses) return { percent: 0, taken: 0, total: 0, byDaypart: {} as Record<Daypart, number[]> };

    let t = 0;
    let takenCount = 0;
    const groups: Record<Daypart, number[]> = {
      morning: [], noon: [], evening: [], night: [],
    };

    for (const d of doses) {
      t++;
      if (d.dose.status === "taken") takenCount++;
      groups[d.dose.daypart].push(d.dose.scheduledAt);
    }

    return {
      percent: t === 0 ? 0 : (takenCount / t) * 100,
      taken: takenCount,
      total: t,
      byDaypart: groups,
    };
  }, [doses]);

  if (doses === undefined) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#146a5c" />
      </View>
    );
  }

  const hasDoses = doses.length > 0;

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-md pb-md"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#146a5c" />
        }
      >
        {/* Adherence hero */}
        <View className="items-center py-lg bg-surface-container-lowest rounded-3xl mt-sm mb-md shadow-clinical">
          <Text className="text-label-lg text-on-surface-variant uppercase tracking-widest mb-sm">
            Today's Adherence
          </Text>
          <AdherenceRing percent={percent} label={`${taken}/${total} doses`} />
          <View className="flex-row gap-lg mt-md">
            {(Object.keys(byDaypart) as Daypart[]).map((dp) => (
              <View key={dp} className="items-center">
                <Text className="text-[11px] text-on-surface-variant">
                  {DAYPART_LABEL[dp]}
                </Text>
                <Text className="text-body-md font-semibold text-primary">
                  {byDaypart[dp].length}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Dose timeline */}
        {hasDoses ? (
          <View className="gap-md">
            <Text className="text-headline-md font-semibold text-on-surface px-sm">
              Today's Schedule
            </Text>
            {DAYPART_ORDER.map((daypart) => {
              const daypartDoses = doses.filter((d) => d.dose.daypart === daypart);
              if (daypartDoses.length === 0) return null;
              return (
                <View key={daypart}>
                  <Text className="text-label-lg font-semibold text-on-surface-variant uppercase tracking-wider px-sm mb-sm">
                    {DAYPART_LABEL[daypart]}
                  </Text>
                  <View className="gap-sm">
                    {daypartDoses.map((d) => (
                      <DoseCard
                        key={d.dose._id}
                        dose={d.dose}
                        medicationName={d.medicationName}
                        medicationAccent={d.medicationAccent}
                        medicationIcon={d.medicationIcon}
                        medicationForm={d.medicationForm}
                        strengthValue={d.strengthValue}
                        strengthUnit={d.strengthUnit}
                        onTake={() => takeDose({ doseInstanceId: d.dose._id })}
                        onSkip={() => skipDose({ doseInstanceId: d.dose._id })}
                        onSnooze={() => snoozeDose({ doseInstanceId: d.dose._id })}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="calendar-outline"
            title="No doses scheduled today"
            subtitle="Add a medication to start tracking your adherence."
          >
            <PillButton
              label="Add Medication"
              icon="add"
              iconPosition="left"
              onPress={() => router.push("/meds/add")}
            />
          </EmptyState>
        )}
      </ScrollView>
    </View>
  );
}
