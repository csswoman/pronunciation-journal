import { redirect } from "next/navigation";

export default async function LexiconDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/words/${id}`);
}
