import {
  Home,
  MicVocal,
  BookOpen,
  Ear,
  Radio,
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
    { name: "Home", href: "/", icon: Home },
    { name: "Diario", href: "/journal", icon: FileText },
  ],
};

export const practiceNav: NavSectionType = {
  label: "Practice",
  items: [
    { name: "Sound Lab", href: "/practice/sounds", icon: MicVocal },
    { name: "Essential Words", href: "/practice/essential-words", icon: ListOrdered },
  ],
};

export const learnNav: NavSectionType = {
  label: "Learn",
  items: [
    { name: "Ruta", href: "/courses", icon: BookOpen },
    { name: "Pronunciación", href: "/courses/pronunciation", icon: Ear },
    { name: "Decks", href: "/practice/decks", icon: Layers },
    { name: "Mini Lessons", href: "/mini-lessons", icon: BookMarked },
  ],
};

export const referenceNav: NavSectionType = {
  label: "Reference",
  items: [
    { name: "IPA Chart", href: "/ipa", icon: Radio },
    { name: "Dictionary", href: "/dictionary", icon: LibraryBig },
  ],
};

export const trackingNav: NavSectionType = {
  label: "Tracking",
  items: [
    { name: "Saved", href: "/tracking", icon: Bookmark },
    { name: "Review", href: "/practice/review", icon: RotateCcw },
    { name: "Progress", href: "/progress", icon: TrendingUp },
  ],
};
