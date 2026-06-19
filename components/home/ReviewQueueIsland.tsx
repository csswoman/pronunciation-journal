"use client";

import { useMergedReviewQueue } from "@/hooks/useMergedReviewQueue";
import ReviewQueueCard from "./ReviewQueueCard";
import type { ReviewQueueSummary } from "@/lib/home/constants";

interface ReviewQueueIslandProps {
  serverSummary: ReviewQueueSummary;
}

export default function ReviewQueueIsland({ serverSummary }: ReviewQueueIslandProps) {
  const summary = useMergedReviewQueue(serverSummary);
  return <ReviewQueueCard summary={summary} />;
}
