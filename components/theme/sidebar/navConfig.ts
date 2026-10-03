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
  Grid2x2,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

/** Group 1: Hoy — daily entry points: home, the day's plan & journal */
export const todayNav: NavSectionType = {
  label: "Hoy",
  items: [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Sesión de hoy", href: "/daily", icon: CalendarCheck, tone: "sky" },
    { name: "Mi diario", href: "/journal", icon: Notebook, tone: "mint" },
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
    { name: "Ruta", href: "/courses", icon: BookOpen, tone: "sky" },
    { name: "Modo Foco", href: "/focus", icon: Radar, tone: "lilac" },
    { name: "Pronunciación", href: "/practice/sounds", icon: MicVocal, tone: "butter" },
    { name: "Vocabulario", href: "/practice/essential-words", icon: Layers, tone: "coral" },
    { name: "Lectura", href: "/practice/reader", icon: BookOpen, tone: "butter" },
    { name: "Inmersión", href: "/practice/immersion", icon: Clapperboard, tone: "mint" },
    { name: "Mini lecciones", href: "/mini-lessons", icon: Sparkles, tone: "sky" },
  ],
};

/** Aliases for backwards compatibility */
export const exploreNav = learnNav;

/** Group 3: Practicar — self-directed drilling */
export const practiceNav: NavSectionType = {
  label: "Practicar",
  items: [
    { name: "Práctica libre", href: "/practice", icon: Target, tone: "coral" },
    { name: "Mazos", href: "/practice/decks", icon: BookOpen, tone: "lilac" },
    { name: "Juegos", href: "/practice/games", icon: Trophy, tone: "butter" },
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
    { name: "Diccionario", href: "/words", icon: LibraryBig, tone: "coral" },
    { name: "Guardadas", href: "/tracking", icon: Bookmark, tone: "coral" },
    { name: "Tabla IPA", href: "/ipa", icon: Grid2x2, tone: "butter" },
    { name: "Repaso", href: "/practice/review", icon: RefreshCw, tone: "sky" },
    { name: "Progreso", href: "/progress", icon: TrendingUp, tone: "lilac" },
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
