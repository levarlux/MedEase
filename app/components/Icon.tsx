import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export interface IconProps {
  /** Ionicons name (e.g. "medical", "eye-outline", "heart"). */
  name: string;
  size?: number;
  color?: string;
  /** Show filled variant (e.g. "heart" vs "heart-outline"). */
  fill?: boolean;
  style?: ComponentProps<typeof Ionicons>["style"];
}

/**
 * Thin icon wrapper around Ionicons.
 *
 * Previously used MaterialSymbols (removed from @expo/vector-icons v15).
 * All Material Symbols names were remapped to their Ionicons equivalents.
 * See app/components/ICON_MIGRATION.md for the full mapping.
 */
export function Icon({
  name,
  size = 24,
  color = "#191c1d",
  fill = false,
  style,
}: IconProps) {
  // Ionicons uses a naming convention where filled variants drop the "-outline"
  // suffix. When fill=true we strip it to get the filled glyph.
  const resolvedName = fill && name.endsWith("-outline")
    ? name.replace(/-outline$/, "")
    : name;

  return (
    <Ionicons
      name={resolvedName as IconName}
      size={size}
      color={color}
      style={style}
    />
  );
}
