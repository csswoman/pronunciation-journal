import type { OwnershipBadgeProps } from "./types";

export default function OwnershipBadge({ isSystem }: OwnershipBadgeProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
        isSystem
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
    >
      {isSystem ? "System" : "Mine"}
    </span>
  );
}
