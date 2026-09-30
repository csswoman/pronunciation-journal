import { db, ensureDbReady } from "@/lib/db";

export async function exportUserVocabulary(userId: string): Promise<void> {
  await ensureDbReady();

  const [favorites, trackedItems, essentialProgress] = await Promise.all([
    db.favorites ? db.favorites.where("userId").equals(userId).toArray() : [],
    db.trackedItems ? db.trackedItems.where("userId").equals(userId).toArray() : [],
    db.essentialWordProgress ? db.essentialWordProgress.where("userId").equals(userId).toArray() : [],
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    userId,
    stats: {
      totalFavorites: favorites.length,
      totalTrackedItems: trackedItems.length,
      totalEssentialProgress: essentialProgress.length,
    },
    vocabulary: {
      favorites,
      trackedItems,
      essentialProgress,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `vocabulario_english_journal_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
