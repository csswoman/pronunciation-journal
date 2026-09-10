import {
  Home,
  Notebook,
  BookOpen,
  Sparkles,
  Target,
  MicVocal,
  LibraryBig,
  Bookmark,
  TrendingUp,
  Radar,
  CalendarCheck,
  Layers,
  Clapperboard,
  RefreshCw,
  Trophy,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

/** Group 1: Hoy — daily entry points: home, the day's plan & journal */
export const todayNav: NavSectionType = {
  label: "Hoy",
  items: [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Plan del día", href: "/daily", icon: CalendarCheck },
    { name: "Mi diario", href: "/journal", icon: Notebook },
  ],
};

/** Alias for backwards compatibility */
export const coreNav = todayNav;

/**
 * Group 2: Aprender — guided study.
 *
 * Pronunciación is a single link: every mode lives as a tab inside
 * /practice/sounds, so a sub-menu would imply five destinations that
 * behave inconsistently.
 */
export const learnNav: NavSectionType = {
  label: "Aprender",
  items: [
    { name: "Ruta", href: "/courses", icon: BookOpen },
    { name: "Modo Foco", href: "/focus", icon: Radar },
    { name: "Pronunciación", href: "/practice/sounds", icon: MicVocal },
    { name: "Vocabulario", href: "/practice/essential-words", icon: Layers },
    { name: "Inmersión", href: "/practice/immersion", icon: Clapperboard },
    { name: "Mini lecciones", href: "/mini-lessons", icon: Sparkles },
  ],
};

/** Aliases for backwards compatibility */
export const exploreNav = learnNav;

/** Group 3: Practicar — self-directed drilling */
export const practiceNav: NavSectionType = {
  label: "Practicar",
  items: [
    { name: "Práctica libre", href: "/practice", icon: Target },
    { name: "Mazos", href: "/practice/decks", icon: BookOpen },
    { name: "Juegos", href: "/practice/games", icon: Trophy },
  ],
};

/**
 * Group 4: Consultar — reference tools & tracking.
 *
 * Repaso lives here, not in "Practicar": the page is a dashboard of what is
 * due (failed sentences, weak words, SRS history), not a drill itself.
 */
export const consultNav: NavSectionType = {
  label: "Consultar",
  items: [
    { name: "Diccionario", href: "/words", icon: LibraryBig },
    { name: "Guardadas", href: "/tracking", icon: Bookmark },
    { name: "Repaso", href: "/practice/review", icon: RefreshCw },
    { name: "Progreso", href: "/progress", icon: TrendingUp },
  ],
};

/**
 * Kept as an empty section so existing consumers that render a footer group
 * keep working; Progreso now lives in `consultNav`.
 */
export const footerNav: NavSectionType = {
  label: "",
  items: [],
};

/** Alias for backwards compatibility */
export const progressNav = footerNav;
