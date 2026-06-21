import { Suspense } from "react";
import SoundLabPage from "@/components/phoneme-practice/SoundLabPage";

export default function SoundsPage() {
  return (
    <Suspense fallback={null}>
      <SoundLabPage />
    </Suspense>
  );
}
