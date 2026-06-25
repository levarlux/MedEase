import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import { TopAppBar, DoseCard, EmptyState } from "@/components";
import { api } from "@convex/_generated/api";
import { localDateString, DAYPART_ORDER, DAYPART_LABEL } from "@mediflow/shared";
import type { Daypart } from "@mediflow/shared";

/** Build the 7-day strip centered on today. */
function buildWeek(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Show 3 days back + today + 3 days forward.
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (i - 3));
    return d;
  });
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Schedule screen — calendar strip + day view of doses.
 *
 * Lets the user browse a 7-day window and see all materialized doses for the
 * selected day, grouped by daypart.
 */
export default function ScheduleScreen() {
  const week = useMemo(buildWeek, []);
  const [selectedDate, setSelectedDate] = useState(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  });

  // Query window: start-of-day to end-of-day for the selected date.
  const { from, to } = useMemo(() => {
    const f = new Date(selectedDate);
    f.setHours(0, 0, 0, 0);
    const t = new Date(selectedDate);
    t.setHours(23, 59, 59, 999);
    return { from: f.getTime(), to: t.getTime() };
  }, [selectedDate]);

  const doses = useQuery(api.doses.listByRange, { from, to });

  const selectedKey = localDateString(selectedDate);
  const todayKey = localDateString(new Date());

  return (
    <View className="flex-1 bg-background">
      <TopAppBar />
      <ScrollView className="flex-1" contentContainerClassName="px-md pb-md">
        <Text className="text-headline-md font-semibold text-on-surface px-sm mt-sm mb-md">
          Schedule
        </Text>

        {/* Calendar strip */}
        <View className="flex-row justify-between mb-md">
          {week.map((date) => {
            const key = localDateString(date);
            const isSelected = key === selectedKey;
            const isToday = key === todayKey;
            return (
              <Pressable
                key={key}
                onPress={() => setSelectedDate(date)}
                className={`flex-1 items-center py-sm rounded-2xl mx-0.5 ${
                  isSelected ? "bg-primary" : "bg-surface-container-lowest"
                }`}
              >
                <Text
                  className={`text-[10px] ${
                    isSelected ? "text-on-primary/80" : "text-on-surface-variant"
                  }`}
                >
                  {WEEKDAY_SHORT[date.getDay()]}
                </Text>
                <Text
                  className={`text-body-md font-bold ${
                    isSelected ? "text-on-primary" : isToday ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {date.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Doses for selected day */}
        {doses === undefined ? (
          <ActivityIndicator size="large" color="#146a5c" className="mt-xl" />
        ) : doses.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nothing scheduled"
            subtitle={`No doses for ${selectedKey}.`}
          />
        ) : (
          <View className="gap-md">
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
                        compact
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
