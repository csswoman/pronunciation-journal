import Button from "@/components/ui/Button";
import Link from "next/link";

export interface NavButtonProps {
  active: boolean;
  onClick?: () => void | Promise<void>;
  children: React.ReactNode;
  as?: "link" | "button";
  href?: string;
}

export function NavButton({ active, onClick, children, as = "button", href }: NavButtonProps) {
  const baseClasses = "relative flex items-center gap-2.5 px-3 h-9 rounded-lg text-sm font-medium transition-all duration-150 group";
  const baseStyle = active
    ? { background: "var(--btn-regular-bg)", color: "var(--primary)" }
    : { color: "var(--text-secondary)" };

  if (as === "link" && href) {
    return (
      <Link href={href} className={baseClasses} style={baseStyle}>
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
            style={{ background: "var(--primary)" }}
          />
        )}
        {!active && (
          <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
                style={{ background: "var(--btn-plain-bg-hover)" }} />
        )}
        {children}
      </Link>
    );
  }

  return (
    <Button onClick={onClick} className={baseClasses} style={baseStyle}>
      {!active && (
        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 -z-10"
              style={{ background: "var(--btn-plain-bg-hover)" }} />
      )}
      {children}
    </Button>
  );
}
