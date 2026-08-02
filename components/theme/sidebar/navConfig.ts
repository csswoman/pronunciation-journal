import {
  Home,
  MicVocal,
  BookOpen,
  TrendingUp,
  LibraryBig,
  BookMarked,
  Layers,
  ListOrdered,
  RotateCcw,
  Bookmark,
  FileText,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

export const coreNav: NavSectionType = {
  label: "",
  items: [
    { name: "Inicio", href: "/", icon: Home },
    { name: "Diario", href: "/journal", icon: FileText },
  ],
};

/** Practice + review destinations — the daily work surface. */
export const practiceNav: NavSectionType = {
  label: "Práctica",
  items: [
    { name: "Laboratorio de sonidos", href: "/practice/sounds", icon: MicVocal },
    { name: "Palabras esenciales", href: "/practice/essential-words", icon: ListOrdered },
    { name: "Mazos", href: "/practice/decks", icon: Layers },
    { name: "Repaso", href: "/practice/review", icon: RotateCcw },
  ],
};

/** Courses, reference, and tracking — browse and look back. */
export const exploreNav: NavSectionType = {
  label: "Explorar",
  items: [
    { name: "Ruta", href: "/courses", icon: BookOpen },
    { name: "Mini lecciones", href: "/mini-lessons", icon: BookMarked },
    { name: "Diccionario", href: "/dictionary", icon: LibraryBig },
    { name: "Guardado", href: "/tracking", icon: Bookmark },
    { name: "Progreso", href: "/progress", icon: TrendingUp },
  ],
};
