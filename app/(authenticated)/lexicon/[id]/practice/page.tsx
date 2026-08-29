import { redirect } from "next/navigation";

export default async function LexiconPracticeRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/words/${id}/practice`);
}
