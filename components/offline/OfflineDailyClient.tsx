"use client";

// Planned structure:
// <OfflineDailyClient>
//   <AuthProvider>
//     <DailyChecklist />
//   </AuthProvider>
// </OfflineDailyClient>

import AuthProvider from "@/components/auth/AuthProvider";
import DailyChecklist from "@/components/daily/DailyChecklist";

export function OfflineDailyClient() {
  return (
    <AuthProvider>
      <DailyChecklist conceptLesson={null} />
    </AuthProvider>
  );
}
