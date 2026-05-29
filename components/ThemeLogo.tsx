"use client";

import Image from "next/image";
import { useTheme } from "./ThemeProvider";

interface ThemeLogoProps {
  /** "icon" renders logo.png; "full" renders the text logo (theme-aware) */
  variant: "icon" | "full";
  className?: string;
  /** Height in pixels — width auto-scales to maintain aspect ratio */
  height?: number;
  /** Width in pixels (optional, mainly for the icon variant) */
  width?: number;
  /** Alt text override */
  alt?: string;
}

export function ThemeLogo({
  variant,
  className = "",
  height,
  width,
  alt = "TsisMissed",
}: ThemeLogoProps) {
  const { theme } = useTheme();

  if (variant === "icon") {
    const size = height ?? width ?? 32;
    return (
      <Image
        src="/logo.png"
        alt={alt}
        width={size}
        height={size}
        className={`object-contain ${className}`}
        priority
      />
    );
  }

  // Full text logo — switch by theme
  const src =
    theme === "light"
      ? "/logo_with_text_light.png"
      : "/logo_with_text_dark.png";

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 280}
      height={height ?? 56}
      className={`object-contain ${className}`}
      priority
    />
  );
}
