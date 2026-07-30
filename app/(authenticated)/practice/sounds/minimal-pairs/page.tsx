import { redirect } from "next/navigation";

interface MinimalPairsPageProps {
  searchParams: Promise<{ phoneme?: string; contrast?: string }>;
}

export default async function MinimalPairsPage({ searchParams }: MinimalPairsPageProps) {
  const { phoneme, contrast } = await searchParams;
  const params = new URLSearchParams({ tab: "minimal-pairs" });
  if (contrast) params.set("contrast", contrast);
  if (phoneme && !contrast) params.set("phoneme", phoneme);
  redirect(`/practice/sounds?${params.toString()}`);
}
