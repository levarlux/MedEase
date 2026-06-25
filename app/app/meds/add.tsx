import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "@/components/Icon";
import { LabeledInput } from "@/components/LabeledInput";
import { PillButton } from "@/components/PillButton";
import { MED_FORM_ICON } from "@mediflow/shared";
import type { MedForm, Frequency, FoodRule, StrengthUnit } from "@mediflow/shared";
import { api } from "@convex/_generated/api";

/* ------------------------------------------------------------------ */
/* Step types                                                          */
/* ------------------------------------------------------------------ */

interface DraftMed {
  name: string;
  strengthValue: string;
  strengthUnit: StrengthUnit;
  form: MedForm;
  foodRule: FoodRule;
  instructions: string;

  frequency: Frequency;
  times: string[];
  intervalHours: string;

  dailyMax: string;
  minSpacingHours: string;
  missedAfterMinutes: string;

  refillEnabled: boolean;
  totalQuantity: string;
  currentQuantity: string;
  refillThreshold: string;

  startDate: string;
}

const INITIAL_DRAFT: DraftMed = {
  name: "",
  strengthValue: "500",
  strengthUnit: "mg",
  form: "pill",
  foodRule: "anytime",
  instructions: "",
  frequency: "everyday",
  times: ["08:00"],
  intervalHours: "6",
  dailyMax: "4",
  minSpacingHours: "4",
  missedAfterMinutes: "60",
  refillEnabled: true,
  totalQuantity: "30",
  currentQuantity: "30",
  refillThreshold: "25",
  startDate: new Date().toISOString().split("T")[0],
};

const STEPS = ["Identity", "Schedule", "Safety", "Inventory"] as const;
type Step = (typeof STEPS)[number];

/* ------------------------------------------------------------------ */
/* Small selectable chip helpers                                       */
/* ------------------------------------------------------------------ */

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-md py-sm rounded-full border-2 ${
        selected ? "bg-primary border-primary" : "bg-transparent border-outline-variant"
      }`}
    >
      <Text
        className={`text-label-lg font-semibold ${
          selected ? "text-on-primary" : "text-on-surface"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Wizard                                                              */
/* ------------------------------------------------------------------ */

export default function AddMedicationScreen() {
  const [step, setStep] = useState<Step>("Identity");
  const [draft, setDraft] = useState<DraftMed>(INITIAL_DRAFT);
  const [saving, setSaving] = useState(false);
  const createMed = useMutation(api.medications.create);

  const stepIndex = STEPS.indexOf(step);

  const update = (patch: Partial<DraftMed>) =>
    setDraft((d) => ({ ...d, ...patch }));

  const next = () => {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  };

  const back = () => {
    const i = STEPS.indexOf(step);
    if (i > 0) setStep(STEPS[i - 1]);
    else router.back();
  };

  const canProceed = (): boolean => {
    if (step === "Identity") return draft.name.trim().length > 0;
    if (step === "Schedule") {
      if (draft.frequency === "everyday" || draft.frequency === "specific_days") {
        return draft.times.length > 0;
      }
      if (draft.frequency === "interval") return draft.intervalHours.trim() !== "";
      return true;
    }
    return true;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const sv = parseFloat(draft.strengthValue);
      if (isNaN(sv) || sv <= 0) throw new Error("Strength must be a positive number.");

      const payload = {
        name: draft.name.trim(),
        strengthValue: sv,
        strengthUnit: draft.strengthUnit,
        form: draft.form,
        foodRule: draft.foodRule,
        ...(draft.instructions.trim() && { instructions: draft.instructions.trim() }),
        frequency: draft.frequency,
        weekdays: [] as (1 | 2 | 3 | 4 | 5 | 6 | 7)[],
        times: draft.frequency === "as_needed" ? [] : draft.times,
        intervalHours: draft.frequency === "interval"
          ? parseFloat(draft.intervalHours)
          : null,
        minSpacingHours: parseFloat(draft.minSpacingHours) || 4,
        dailyMax: parseFloat(draft.dailyMax) || 4,
        missedAfterMinutes: parseFloat(draft.missedAfterMinutes) || 60,
        refillEnabled: draft.refillEnabled,
        totalQuantity: parseFloat(draft.totalQuantity) || 0,
        currentQuantity: parseFloat(draft.currentQuantity) || 0,
        refillThreshold: parseFloat(draft.refillThreshold) || 0,
        accent: "primary" as const,
        icon: MED_FORM_ICON[draft.form],
        startDate: draft.startDate,
        endDate: null,
      };

      await createMed(payload);
      router.back();
    } catch (err) {
      Alert.alert("Could not save", (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-md py-sm">
          <Pressable onPress={back} hitSlop={8} className="mr-md">
            <Icon name="chevron-back" size={26} color="#146a5c" />
          </Pressable>
          <Text className="text-headline-md font-semibold text-on-surface flex-1">
            Add Medication
          </Text>
          <Text className="text-label-sm text-on-surface-variant">
            {stepIndex + 1} / {STEPS.length}
          </Text>
        </View>

        {/* Progress bar */}
        <View className="h-1 bg-surface-container-high mx-md rounded-full mb-sm">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </View>

        <ScrollView className="flex-1 px-md" contentContainerClassName="pb-md gap-md">
          {/* STEP 1: Identity */}
          {step === "Identity" && (
            <View className="gap-md">
              <LabeledInput
                label="Medication Name"
                value={draft.name}
                onChangeText={(v) => update({ name: v })}
                placeholder="e.g. Metformin"
                leadingIcon="medkit-outline"
              />
              <View className="flex-row gap-md">
                <View className="flex-1">
                  <LabeledInput
                    label="Strength"
                    value={draft.strengthValue}
                    onChangeText={(v) => update({ strengthValue: v })}
                    placeholder="500"
                    keyboardType="numeric"
                  />
                </View>
                <View className="w-32">
                  <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
                    Unit
                  </Text>
                  <View className="flex-row flex-wrap gap-1">
                    {(["mg", "mcg", "ml", "g", "IU", "puff", "drop"] as StrengthUnit[]).map((u) => (
                      <Chip
                        key={u}
                        label={u}
                        selected={draft.strengthUnit === u}
                        onPress={() => update({ strengthUnit: u })}
                      />
                    ))}
                  </View>
                </View>
              </View>
              <View>
                <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
                  Form
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {(["pill", "injection", "liquid", "other"] as MedForm[]).map((f) => (
                    <Pressable
                      key={f}
                      onPress={() => update({ form: f })}
                      className={`flex-row items-center gap-2 px-md py-sm rounded-full border-2 ${
                        draft.form === f ? "bg-primary border-primary" : "border-outline-variant"
                      }`}
                    >
                      <Icon
                        name={MED_FORM_ICON[f]}
                        size={16}
                        color={draft.form === f ? "#ffffff" : "#3f4946"}
                      />
                      <Text
                        className={`text-label-lg font-semibold capitalize ${
                          draft.form === f ? "text-on-primary" : "text-on-surface"
                        }`}
                      >
                        {f}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              <View>
                <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
                  Food Rule
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Chip label="Anytime" selected={draft.foodRule === "anytime"} onPress={() => update({ foodRule: "anytime" })} />
                  <Chip label="With Food" selected={draft.foodRule === "with_food"} onPress={() => update({ foodRule: "with_food" })} />
                  <Chip label="Empty Stomach" selected={draft.foodRule === "empty_stomach"} onPress={() => update({ foodRule: "empty_stomach" })} />
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: Schedule */}
          {step === "Schedule" && (
            <View className="gap-md">
              <View>
                <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
                  Frequency
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <Chip label="Every Day" selected={draft.frequency === "everyday"} onPress={() => update({ frequency: "everyday" })} />
                  <Chip label="Specific Days" selected={draft.frequency === "specific_days"} onPress={() => update({ frequency: "specific_days" })} />
                  <Chip label="Interval" selected={draft.frequency === "interval"} onPress={() => update({ frequency: "interval" })} />
                  <Chip label="As Needed" selected={draft.frequency === "as_needed"} onPress={() => update({ frequency: "as_needed" })} />
                </View>
              </View>

              {(draft.frequency === "everyday" || draft.frequency === "specific_days") && (
                <View>
                  <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
                    Times (HH:MM, 24h)
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {draft.times.map((t, i) => (
                      <View key={i} className="flex-row items-center bg-surface-container-low rounded-full pl-md pr-sm py-sm">
                        <Text className="text-label-lg text-on-surface mr-sm">{t}</Text>
                        <Pressable onPress={() => update({ times: draft.times.filter((_, j) => j !== i) })}>
                          <Icon name="close-circle" size={16} color="#ba1a1a" />
                        </Pressable>
                      </View>
                    ))}
                    <Pressable
                      onPress={() => update({ times: [...draft.times, "12:00"] })}
                      className="flex-row items-center gap-1 px-md py-sm rounded-full border-2 border-dashed border-outline-variant"
                    >
                      <Icon name="add" size={16} color="#146a5c" />
                      <Text className="text-label-lg text-primary font-semibold">Add</Text>
                    </Pressable>
                  </View>
                  <Text className="text-label-sm text-outline mt-1">
                    Quick add:{" "}
                    {["08:00", "12:00", "18:00", "22:00"]
                      .filter((t) => !draft.times.includes(t))
                      .map((t) => (
                        <Text
                          key={t}
                          onPress={() => update({ times: [...draft.times, t].sort() })}
                          className="text-primary font-semibold"
                        >
                          {t}{" "}
                        </Text>
                      ))}
                  </Text>
                </View>
              )}

              {draft.frequency === "interval" && (
                <LabeledInput
                  label="Interval (hours)"
                  value={draft.intervalHours}
                  onChangeText={(v) => update({ intervalHours: v })}
                  placeholder="6"
                  keyboardType="numeric"
                  leadingIcon="time-outline"
                />
              )}
            </View>
          )}

          {/* STEP 3: Safety */}
          {step === "Safety" && (
            <View className="gap-md">
              <Text className="text-body-md text-on-surface-variant">
                These constraints power the adaptive engine — it uses them to decide
                whether a missed dose is safe to take or should be skipped.
              </Text>
              <LabeledInput
                label="Min Spacing (hours)"
                value={draft.minSpacingHours}
                onChangeText={(v) => update({ minSpacingHours: v })}
                keyboardType="numeric"
                leadingIcon="hourglass-outline"
              />
              <LabeledInput
                label="Daily Max (doses)"
                value={draft.dailyMax}
                onChangeText={(v) => update({ dailyMax: v })}
                keyboardType="numeric"
                leadingIcon="shield-checkmark-outline"
              />
              <LabeledInput
                label="Missed After (minutes)"
                value={draft.missedAfterMinutes}
                onChangeText={(v) => update({ missedAfterMinutes: v })}
                keyboardType="numeric"
                leadingIcon="alert-circle-outline"
              />
            </View>
          )}

          {/* STEP 4: Inventory */}
          {step === "Inventory" && (
            <View className="gap-md">
              <Pressable
                onPress={() => update({ refillEnabled: !draft.refillEnabled })}
                className="flex-row items-center justify-between p-md bg-surface-container-lowest rounded-2xl"
              >
                <View className="flex-1">
                  <Text className="text-body-md font-semibold text-on-surface">
                    Refill Tracking
                  </Text>
                  <Text className="text-label-sm text-on-surface-variant">
                    Track stock and get refill alerts
                  </Text>
                </View>
                <View
                  className={`w-12 h-7 rounded-full p-0.5 ${draft.refillEnabled ? "bg-primary" : "bg-surface-container-high"}`}
                >
                  <View
                    className={`w-6 h-6 rounded-full bg-white ${draft.refillEnabled ? "ml-auto" : ""}`}
                  />
                </View>
              </Pressable>

              {draft.refillEnabled && (
                <>
                  <View className="flex-row gap-md">
                    <View className="flex-1">
                      <LabeledInput
                        label="Total Quantity"
                        value={draft.totalQuantity}
                        onChangeText={(v) => update({ totalQuantity: v })}
                        keyboardType="numeric"
                      />
                    </View>
                    <View className="flex-1">
                      <LabeledInput
                        label="Current Quantity"
                        value={draft.currentQuantity}
                        onChangeText={(v) => update({ currentQuantity: v })}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                  <LabeledInput
                    label="Refill Threshold (%)"
                    value={draft.refillThreshold}
                    onChangeText={(v) => update({ refillThreshold: v })}
                    keyboardType="numeric"
                    placeholder="25"
                  />
                </>
              )}

              <View className="bg-primary-container/30 p-md rounded-2xl mt-md">
                <View className="flex-row items-center gap-2">
                  <Icon name="information-circle" size={20} color="#005c4f" />
                  <Text className="text-label-lg font-semibold text-primary-container">
                    Ready to save
                  </Text>
                </View>
                <Text className="text-label-sm text-on-surface-variant mt-1">
                  The cron job will start materializing doses within 15 minutes.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer nav */}
        <View className="flex-row gap-sm px-md py-md border-t border-outline-variant">
          {stepIndex > 0 && (
            <PillButton
              label="Back"
              variant="outline"
              fullWidth={false}
              onPress={back}
            />
          )}
          <View className="flex-1">
            {stepIndex < STEPS.length - 1 ? (
              <PillButton
                label="Continue"
                icon="arrow-forward"
                iconPosition="right"
                onPress={next}
                disabled={!canProceed()}
              />
            ) : (
              <PillButton
                label={saving ? "Saving…" : "Save Medication"}
                icon={saving ? undefined : "checkmark"}
                loading={saving}
                onPress={handleSave}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
