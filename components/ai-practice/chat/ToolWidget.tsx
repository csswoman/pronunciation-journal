"use client";

import type { ToolCall } from "@/lib/ai-practice/types";
import type { ExerciseResult } from "@/lib/ai-practice/types";
import MultipleChoiceWidget from "../widgets/MultipleChoiceWidget";
import FillBlankWidget from "../widgets/FillBlankWidget";
import SpeakingWidget from "../widgets/SpeakingWidget";
import WordCardWidget from "../widgets/WordCardWidget";
import type {
  MultipleChoiceArgs,
  FillBlankArgs,
  SpeakingArgs,
  WordCardArgs,
} from "@/lib/ai-practice/tools/registry";

interface Props {
  toolCall: ToolCall;
  onAnswer: (callId: string, result: ExerciseResult) => void;
}

export default function ToolWidget({ toolCall, onAnswer }: Props) {
  if (toolCall.status === "error") return null;

  const handleAnswer = (result: ExerciseResult) => onAnswer(toolCall.id, result);

  switch (toolCall.name) {
    case "render_multiple_choice":
      return (
        <MultipleChoiceWidget
          args={toolCall.args as MultipleChoiceArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
        />
      );
    case "render_fill_blank":
      return (
        <FillBlankWidget
          args={toolCall.args as FillBlankArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
        />
      );
    case "render_speaking":
      return (
        <SpeakingWidget
          args={toolCall.args as SpeakingArgs}
          status={toolCall.status}
          onAnswer={handleAnswer}
        />
      );
    case "render_word_card":
      return <WordCardWidget args={toolCall.args as WordCardArgs} />;
    default:
      return null;
  }
}
