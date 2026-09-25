interface SocialDividerProps {
  label?: string;
}

export function SocialDivider({ label = "o con tu correo" }: SocialDividerProps) {
  return (
    <div className="flex items-center gap-3 my-6 text-fg-muted text-xs font-medium select-none">
      <div className="flex-1 border-t border-border" />
      <span className="px-1 text-fg-muted">{label}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}


