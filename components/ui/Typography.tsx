import { ElementType, HTMLAttributes } from "react";

type HeadingProps<T extends ElementType> = {
  as?: T;
  className?: string;
} & Omit<HTMLAttributes<HTMLHeadingElement>, "className">;

export function H1<T extends ElementType = "h1">({ as, className, ...props }: HeadingProps<T>) {
  const Tag = (as ?? "h1") as ElementType;
  return <Tag className={["font-h1 text-fg", className].filter(Boolean).join(" ")} {...props} />;
}

export function H2<T extends ElementType = "h2">({ as, className, ...props }: HeadingProps<T>) {
  const Tag = (as ?? "h2") as ElementType;
  return <Tag className={["font-h2 text-fg", className].filter(Boolean).join(" ")} {...props} />;
}

export function H3<T extends ElementType = "h3">({ as, className, ...props }: HeadingProps<T>) {
  const Tag = (as ?? "h3") as ElementType;
  return <Tag className={["font-h3 text-fg", className].filter(Boolean).join(" ")} {...props} />;
}

export function H4<T extends ElementType = "h4">({ as, className, ...props }: HeadingProps<T>) {
  const Tag = (as ?? "h4") as ElementType;
  return <Tag className={["font-h4 text-fg", className].filter(Boolean).join(" ")} {...props} />;
}
