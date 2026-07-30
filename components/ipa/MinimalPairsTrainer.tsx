import { MinimalPairsRunner } from "@/components/sounds/MinimalPairsRunner";

export default function MinimalPairsTrainer({
  phoneme,
}: {
  phoneme: string;
}) {
  return <MinimalPairsRunner initialPhoneme={phoneme} />;
}
