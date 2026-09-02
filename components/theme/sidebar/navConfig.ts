import {
  Home,
  CalendarCheck,
  Notebook,
  BookOpen,
  Sparkles,
  Target,
  LibraryBig,
  Bookmark,
  TrendingUp,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

/** Group 1: Hoy - daily entry point, daily plan & journal */
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

/** Group 2: Aprender - courses, mini lessons & free practice */
export const learnNav: NavSectionType = {
  label: "Aprender",
  items: [
    { name: "Ruta", href: "/courses", icon: BookOpen },
    { name: "Mini lecciones", href: "/mini-lessons", icon: Sparkles },
    { name: "Práctica libre", href: "/practice", icon: Target },
  ],
};

/** Aliases for backwards compatibility */
export const exploreNav = learnNav;
export const practiceNav = learnNav;

/** Group 3: Consultar - dictionary & saved tracking */
export const consultNav: NavSectionType = {
  label: "Consultar",
  items: [
    { name: "Diccionario", href: "/words", icon: LibraryBig },
    { name: "Guardadas", href: "/tracking", icon: Bookmark },
  ],
};

/** Group 4: Footer - progress entry point */
export const footerNav: NavSectionType = {
  label: "",
  items: [
    { name: "Progreso", href: "/progress", icon: TrendingUp },
  ],
};

/** Alias for backwards compatibility */
export const progressNav = footerNav;

