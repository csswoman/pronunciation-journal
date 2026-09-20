import {
  BookOpen,
  Layers,
  Code2,
  Briefcase,
  Home,
  Zap,
  Mic,
  Music,
  Globe,
  Target,
  type AppIconProps,
} from "@/components/icons";
import type { ComponentType } from "react";

export const DECK_ICONS = [
  "book",
  "layers",
  "code",
  "briefcase",
  "home",
  "zap",
  "mic",
  "music",
  "globe",
  "target",
] as const;

export type DeckIconKey = (typeof DECK_ICONS)[number];

export const ICON_MAP: Record<string, ComponentType<AppIconProps>> = {
  book: BookOpen,
  layers: Layers,
  code: Code2,
  briefcase: Briefcase,
  home: Home,
  zap: Zap,
  mic: Mic,
  music: Music,
  globe: Globe,
  target: Target,
};

export const DECK_COLORS = [
  "lilac",
  "sky",
  "coral",
  "butter",
  "mint",
] as const;

export type DeckColorTone = (typeof DECK_COLORS)[number];

export function getDeckIconComponent(iconKey?: string | null): ComponentType<AppIconProps> {
  const normalized = normalizeDeckIcon(iconKey);
  return ICON_MAP[normalized] ?? BookOpen;
}

export function normalizeDeckTone(color?: string | null, name?: string): DeckColorTone {
  if (color) {
    if (color === "lilac" || color === "sky" || color === "coral" || color === "butter" || color === "mint") {
      return color;
    }
    if (color.includes("6366f1") || color.includes("3b82f6") || color.includes("06b6d4")) return "sky";
    if (color.includes("8b5cf6") || color.includes("ec4899")) return "lilac";
    if (color.includes("f43f5e") || color.includes("f97316")) return "coral";
    if (color.includes("22c55e") || color.includes("14b8a6")) return "mint";
    if (color.includes("eab308")) return "butter";
  }
  let hash = 0;
  const str = name || "deck";
  for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
  return DECK_COLORS[Math.abs(hash) % DECK_COLORS.length];
}

export function normalizeDeckIcon(icon?: string | null): DeckIconKey {
  if (!icon || icon === "sparkles") return "book";
  if (icon in ICON_MAP) return icon as DeckIconKey;
  if (icon.includes("💻") || icon.includes("⚙️") || icon.includes("code")) return "code";
  if (icon.includes("💼") || icon.includes("biz")) return "briefcase";
  if (icon.includes("🏠") || icon.includes("home")) return "home";
  if (icon.includes("⚡") || icon.includes("💡") || icon.includes("zap")) return "zap";
  if (icon.includes("🎙️") || icon.includes("🎤") || icon.includes("mic")) return "mic";
  if (icon.includes("🎵") || icon.includes("🎧") || icon.includes("music")) return "music";
  if (icon.includes("🌐") || icon.includes("🌍") || icon.includes("globe")) return "globe";
  if (icon.includes("🎯") || icon.includes("target")) return "target";
  if (icon.includes("📚") || icon.includes("📖") || icon.includes("book")) return "book";
  return "book";
}


