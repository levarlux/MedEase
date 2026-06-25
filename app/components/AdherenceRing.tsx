import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface AdherenceRingProps {
  /** 0–100 percentage of doses taken. */
  percent: number;
  /** Diameter in px. */
  size?: number;
  /** Stroke width in px. */
  strokeWidth?: number;
  /** Hex color for the progress arc. */
  color?: string;
  /** Track (background) color. */
  trackColor?: string;
  /** Center label below the percentage. */
  label?: string;
}

/**
 * Circular progress ring for adherence display.
 *
 * Animated on mount from 0 → percent. Used on the dashboard to show today's
 * dose adherence at a glance.
 */
export function AdherenceRing({
  percent,
  size = 140,
  strokeWidth = 12,
  color = "#146a5c",
  trackColor = "#e7e8e9",
  label,
}: AdherenceRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const anim = useRef(new Animated.Value(circumference));

  // Animate the strokeDashoffset from full circle → target.
  useEffect(() => {
    const target = circumference - (Math.min(100, Math.max(0, percent)) / 100) * circumference;
    Animated.timing(anim.current, {
      toValue: target,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percent, circumference]);

  return (
    <View className="items-center justify-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} className="-rotate-90">
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={anim.current}
            fill="none"
          />
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-[28px] font-bold text-primary">
            {Math.round(percent)}%
          </Text>
          {label && (
            <Text className="text-[11px] text-on-surface-variant mt-0.5">
              {label}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
