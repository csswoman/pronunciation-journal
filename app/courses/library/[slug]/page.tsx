"use client";
import { use } from "react";
import CourseView from "@/components/courses/CourseView";

export default function LibraryItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <CourseView slug={slug} />;
}
