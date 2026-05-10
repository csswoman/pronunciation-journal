import {
  Home,
  MicVocal,
  BookMarked,
  BookOpen,
  Radio,
  Folder,
  TrendingUp,
  Settings,
} from "lucide-react";
import { NavSectionType } from "./NavSection";

export const coreNav: NavSectionType = {
  label: "",
  items: [
    { name: "Home", href: "/", icon: Home },
    { name: "Practice", href: "/practice", icon: MicVocal },
  ],
};

export const learningNav: NavSectionType = {
  label: "Learning",
  items: [
    { name: "Word Bank", href: "/words", icon: BookMarked },
    { name: "Decks", href: "/decks", icon: Folder },
    { name: "Courses", href: "/courses", icon: BookOpen },
    { name: "IPA Chart", href: "/ipa", icon: Radio },
  ],
};

export const trackingNav: NavSectionType = {
  label: "Tracking",
  items: [
    { name: "Progress", href: "/progress", icon: TrendingUp },
  ],
};

export const adminNav: NavSectionType = {
  label: "Admin",
  items: [
    { name: "Seed Data", href: "/admin/seed", icon: Settings },
    { name: "Manage Lessons", href: "/admin/lessons", icon: BookOpen },
  ],
};
