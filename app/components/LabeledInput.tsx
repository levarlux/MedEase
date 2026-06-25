import type { ReactNode } from "react";
import { useState } from "react";
import {
  KeyboardTypeOptions,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Icon } from "./Icon";

export interface LabeledInputProps
  extends Omit<TextInputProps, "style"> {
  label: string;
  leadingIcon?: string;
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  keyboardType?: KeyboardTypeOptions;
}

/**
 * Filled-style labeled text input.
 *
 * Port of the prototypes' input pattern: light neutral fill, no border until
 * focused, then a 2px primary border + focus ring. Optional leading icon and
 * trailing element (used for the password visibility toggle on login).
 */
export function LabeledInput({
  label,
  leadingIcon,
  trailing,
  containerStyle,
  value,
  placeholder,
  ...rest
}: LabeledInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      <Text className="mb-2 text-label-lg text-on-surface-variant font-semibold">
        {label}
      </Text>
      <View
        className={[
          "h-14 flex-row items-center rounded-xl px-md gap-2",
          focused
            ? "bg-surface-container-lowest border-2 border-primary"
            : "bg-surface-container-low border-2 border-transparent",
        ].join(" ")}
      >
        {leadingIcon && (
          <Icon name={leadingIcon} size={20} color={focused ? "#146a5c" : "#6f7976"} />
        )}
        <TextInput
          className="flex-1 text-[16px] text-on-surface"
          placeholderTextColor="#6f7976"
          value={value}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...rest}
        />
        {trailing}
      </View>
    </View>
  );
}
