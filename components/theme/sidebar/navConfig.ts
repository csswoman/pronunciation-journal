import {
  Home,
  FileText,
  Target,
  BookOpen,
  BookMarked,
  LibraryBig,
  TrendingUp,
  CalendarCheck,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

/** Group 1: Hoy - daily entry point & journal */
export const todayNav: NavSectionType = {
  label: "Hoy",
  items: [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Plan diario", href: "/daily", icon: CalendarCheck },
    { name: "Diario", href: "/journal", icon: FileText },
  ],
};

/** Alias for backwards compatibility */
export const coreNav = todayNav;

/** Group 2: Práctica - single entry point to free practice hub */
export const practiceNav: NavSectionType = {
  label: "Práctica",
  items: [
    { name: "Práctica libre", href: "/practice", icon: Target },
  ],
};

/** Group 3: Explorar - courses, mini lessons & dictionary */
export const exploreNav: NavSectionType = {
  label: "Explorar",
  items: [
    { name: "Ruta", href: "/courses", icon: BookOpen },
    { name: "Mini lecciones", href: "/mini-lessons", icon: BookMarked },
    { name: "Diccionario", href: "/dictionary", icon: LibraryBig },
  ],
};

/** Group 4: Progreso - learning progress and tracking */
export const progressNav: NavSectionType = {
  label: "",
  items: [
    { name: "Progreso", href: "/progress", icon: TrendingUp },
  ],
};

