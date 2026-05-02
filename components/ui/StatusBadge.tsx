import Badge from "@/components/ui/Badge";

interface StatusBadgeProps {
  ok: boolean | null;
  message: string;
}

export default function StatusBadge({ ok, message }: StatusBadgeProps) {
  if (ok === null) return null;
  return <Badge label={message} variant={ok ? "success" : "error"} size="md" />;
}
