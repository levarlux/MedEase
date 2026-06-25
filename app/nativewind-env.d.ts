/// <reference types="nativewind/types" />

/**
 * NativeWind className augmentation for React Native components.
 *
 * NativeWind v4 ships these via react-native-css-interop, but the hoisted
 * monorepo layout can break the triple-slash resolution chain.
 * Declaring them here guarantees className is recognised regardless of
 * where the .d.ts files are resolved from.
 */
import { type ViewProps, type TextProps, type TextInputProps, type ImageProps, type PressableProps } from "react-native";

declare module "react-native" {
  // Core view hierarchy — these are the ones the app actually uses.
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface ScrollViewProps {
    contentContainerClassName?: string;
    className?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
    contentContainerClassName?: string;
  }
}
