import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { Icon } from "./Icon";

export type PillButtonVariant = "primary" | "secondary" | "gradient" | "ghost" | "outline";

export interface PillButtonProps extends Omit<PressableProps, "children" | "style"> {
  label: string;
  variant?: PillButtonVariant;
  icon?: string;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  /** Static view style only (Pressable callback-style style not supported here). */
  style?: StyleProp<ViewStyle>;
}

const VARIANT_STYLES: Record<
  PillButtonVariant,
  { container: string; text: string; icon: string }
> = {
  primary: {
    container: "bg-primary",
    text: "text-on-primary",
    icon: "#ffffff",
  },
  secondary: {
    container: "bg-surface-container-high",
    text: "text-on-surface",
    icon: "#191c1d",
  },
  gradient: {
    container: "bg-primary", // gradient applied via style; fallback solid
    text: "text-on-primary",
    icon: "#ffffff",
  },
  ghost: {
    container: "bg-transparent",
    text: "text-primary",
    icon: "#146a5c",
  },
  outline: {
    container: "bg-transparent border border-outline",
    text: "text-on-surface",
    icon: "#191c1d",
  },
};

/**
 * Pill-shaped CTA. Matches the design system's primary button: full pill,
 * h-14, headline-md label. Variants cover every usage in the prototypes
 * (primary teal, ghost links, outline social, gradient paywall CTA).
 */
export function PillButton({
  label,
  variant = "primary",
  icon,
  iconPosition = "right",
  loading = false,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: PillButtonProps) {
  const v = VARIANT_STYLES[variant];
  const gradient =
    variant === "gradient"
      ? { backgroundColor: "#146a5c" } // TODO: LinearGradient #146a5c → #89d5c4
      : undefined;

  return (
    <Pressable
      disabled={disabled || loading}
      style={[{ opacity: disabled || loading ? 0.6 : 1 }, style]}
      className={[
        "h-14 flex-row items-center justify-center gap-2 rounded-full active:scale-[0.98]",
        fullWidth ? "w-full" : "",
        v.container,
      ].join(" ")}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.icon} />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <Icon name={icon} size={18} color={v.icon} />
          )}
          <Text className={`text-[16px] font-semibold leading-[24px] ${v.text}`}>
            {label}
          </Text>
          {icon && iconPosition === "right" && (
            <Icon name={icon} size={18} color={v.icon} />
          )}
        </>
      )}
    </Pressable>
  );
}
