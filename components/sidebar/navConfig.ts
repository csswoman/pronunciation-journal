import {
  Home,
  MicVocal,
  BookOpen,
  Radio,
  TrendingUp,
  Settings,
  LibraryBig,
  BookMarked,
} from "lucide-react";
import { NavSectionType } from "./NavSection";

export const coreNav: NavSectionType = {
  label: "",
  items: [
    { name: "Home", href: "/", icon: Home },
    { name: "Sound Lab", href: "/practice/sounds", icon: MicVocal },
  ],
};

export const learningNav: NavSectionType = {
  label: "Learning",
  items: [
    { name: "Words", href: "/words", icon: LibraryBig },
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
  ],
};
