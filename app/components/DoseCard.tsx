import { Pressable, Text, View } from "react-native";
import { Icon } from "./Icon";
import { format12h, DAYPART_LABEL } from "@mediflow/shared";
import type { Doc } from "convex/_generated/dataModel";

export interface DoseCardProps {
  dose: Doc<"doseInstances">;
  medicationName: string;
  medicationAccent: string;
  medicationIcon: string;
  medicationForm?: string;
  strengthValue?: number;
  strengthUnit?: string;
  /** When true, shows a compact layout (no actions). */
  compact?: boolean;
  onTake?: () => void;
  onSkip?: () => void;
  onSnooze?: () => void;
  onPress?: () => void;
}

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

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  due: "Due now",
  taken: "Taken",
  skipped: "Skipped",
  snoozed: "Snoozed",
  missed: "Missed",
};

/**
 * Dose instance card with medication info, status, and action buttons.
 * Used on both the dashboard timeline and schedule day view.
 */
export function DoseCard({
  dose,
  medicationName,
  medicationAccent,
  medicationIcon,
  strengthValue,
  strengthUnit,
  compact = false,
  onTake,
  onSkip,
  onSnooze,
  onPress,
}: DoseCardProps) {
  const time = new Date(dose.scheduledAt);
  const hh = String(time.getHours()).padStart(2, "0");
  const mm = String(time.getMinutes()).padStart(2, "0");
  const timeLabel = format12h(`${hh}:${mm}`);
  const daypartLabel = DAYPART_LABEL[dose.daypart];

  const accentBg = ACCENT_BG[medicationAccent] ?? "bg-primary-container";
  const accentIcon = ACCENT_ICON[medicationAccent] ?? "#005c4f";
  const isResolved = dose.status === "taken" || dose.status === "skipped";
  const showActions = !compact && !isResolved && onTake;
  const showStrength = strengthValue !== undefined && strengthUnit !== undefined;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="flex-row items-center gap-md p-md bg-surface-container-lowest rounded-2xl active:opacity-90"
      style={{
        opacity: dose.status === "skipped" ? 0.6 : 1,
      }}
    >
      {/* Icon */}
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center ${accentBg}`}
      >
        <Icon name={medicationIcon} size={24} color={accentIcon} />
      </View>

      {/* Body */}
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="text-body-md font-semibold text-on-surface flex-1" numberOfLines={1}>
            {medicationName}
          </Text>
          <Text className="text-label-sm text-on-surface-variant ml-sm">
            {timeLabel}
          </Text>
        </View>
        <Text className="text-label-sm text-on-surface-variant mt-0.5">
          {showStrength ? `${strengthValue} ${strengthUnit} · ${daypartLabel}` : daypartLabel}
        </Text>

        {/* Status chip + missed advice */}
        <View className="flex-row items-center mt-1 gap-1">
          <View
            className={`px-2 py-0.5 rounded-full ${
              dose.status === "missed"
                ? "bg-error-container"
                : dose.status === "due"
                  ? "bg-primary-container"
                  : "bg-surface-container-high"
            }`}
          >
            <Text
              className={`text-[11px] font-semibold ${
                dose.status === "missed"
                  ? "text-on-error-container"
                  : "text-on-surface-variant"
              }`}
            >
              {STATUS_LABEL[dose.status] ?? dose.status}
            </Text>
          </View>

          {dose.status === "missed" && dose.missedAdvice && (
            <Text className="text-[11px] text-error flex-1" numberOfLines={1}>
              {dose.missedAdvice.action === "take_now"
                ? "Safe to take now"
                : "Skip this one"}
            </Text>
          )}
        </View>

        {/* Action buttons */}
        {showActions && (
          <View className="flex-row gap-sm mt-2">
            <Pressable
              onPress={onTake}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-primary active:opacity-80"
            >
              <Icon name="checkmark" size={14} color="#ffffff" />
              <Text className="text-[12px] font-semibold text-on-primary">
                Take
              </Text>
            </Pressable>
            <Pressable
              onPress={onSnooze}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high active:opacity-80"
            >
              <Icon name="time-outline" size={14} color="#3f4946" />
              <Text className="text-[12px] font-semibold text-on-surface-variant">
                Snooze
              </Text>
            </Pressable>
            <Pressable
              onPress={onSkip}
              className="px-3 py-1.5 rounded-full bg-surface-container-high active:opacity-80"
            >
              <Text className="text-[12px] font-semibold text-on-surface-variant">
                Skip
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Pressable>
  );
}
