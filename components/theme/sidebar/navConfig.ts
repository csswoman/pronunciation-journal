import {
  Home,
  MicVocal,
  BookOpen,
  Radio,
  TrendingUp,
  LibraryBig,
  BookMarked,
  Layers,
  ListOrdered,
  RotateCcw,
} from "@/components/icons";
import { NavSectionType } from "./NavSection";

export const coreNav: NavSectionType = {
  label: "",
  items: [{ name: "Home", href: "/", icon: Home }],
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
    { name: "Review", href: "/practice/review", icon: RotateCcw },
    { name: "Progress", href: "/progress", icon: TrendingUp },
  ],
};
