import {
  Home,
  MicVocal,
  BookOpen,
  Radio,
  TrendingUp,
  Settings,
  LibraryBig,
  BookMarked,
  Layers,
  ListOrdered,
  RotateCcw,
} from "lucide-react";
import { NavSectionType } from "./NavSection";

export const coreNav: NavSectionType = {
  label: "",
  items: [{ name: "Home", href: "/", icon: Home }],
};

export const practiceNav: NavSectionType = {
  label: "Practice",
  items: [
    { name: "Sound Lab", href: "/practice/sounds", icon: MicVocal },
    { name: "Essential Words", href: "/practice/core-1000", icon: ListOrdered },
  ],
};

export const learnNav: NavSectionType = {
  label: "Learn",
  items: [
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "Decks", href: "/practice/decks", icon: Layers },
    { name: "Mini Lessons", href: "/mini-lessons", icon: BookMarked },
  ],
};

export const referenceNav: NavSectionType = {
  label: "Reference",
  items: [
    { name: "IPA Chart", href: "/ipa", icon: Radio },
    { name: "Words", href: "/words", icon: LibraryBig },
  ],
};

export const trackingNav: NavSectionType = {
  label: "Tracking",
  items: [
    { name: "Review", href: "/practice/review", icon: RotateCcw },
    { name: "Progress", href: "/progress", icon: TrendingUp },
  ],
};

export const adminNav: NavSectionType = {
  label: "Admin",
  items: [
    { name: "Seed Data", href: "/admin/seed", icon: Settings },
  ],
};
