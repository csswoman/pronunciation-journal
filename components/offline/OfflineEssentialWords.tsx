"use client";

// Planned structure:
// <OfflineEssentialWords>
//   <PillButton>Volver a mis descargas</PillButton>
//   <AuthProvider>
//     <EssentialWordsSession pinnedLevels={[level]} />
//   </AuthProvider>
// </OfflineEssentialWords>

import AuthProvider from "@/components/auth/AuthProvider";
import { ArrowLeft } from "@/components/icons";
import { EssentialWordsSession } from "@/components/practice/essential-words/EssentialWordsSession";
import { PillButton } from "@/components/ui/PillButton";
import type { CefrLevel } from "@/lib/essential-words/types";

interface OfflineEssentialWordsProps {
  level: CefrLevel;
  onBack: () => void;
}

/** Essential Words from a downloaded level pack, opened inside the offline hub. */
export function OfflineEssentialWords({ level, onBack }: OfflineEssentialWordsProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-6">
      <PillButton variant="quiet" size="sm" className="self-start" icon={<ArrowLeft size={14} />} onClick={onBack}>
        Volver a mis descargas
      </PillButton>
      <AuthProvider>
        <EssentialWordsSession pinnedLevels={[level]} />
      </AuthProvider>
    </div>
  );
}
