import type { HTMLAttributes } from "react";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

// Carte de base utilisee partout dans l'app.
// Elle bloque les debordements mobile et laisse les pages gerer la logique metier.
export function Card({ children, className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        "w-full min-w-0 max-w-full overflow-hidden rounded-3xl bg-white p-3 text-left shadow-sm sm:p-4",
        interactive &&
          "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-950/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("mb-2 flex min-w-0 items-start justify-between gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBadges({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("flex max-w-full flex-wrap gap-2 overflow-hidden", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={classNames("line-clamp-2 break-words text-base font-black leading-snug text-zinc-950", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardStats({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("grid min-w-0 grid-cols-4 gap-1.5 rounded-2xl bg-zinc-50 p-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardActions({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("flex max-w-full shrink-0 flex-wrap gap-2 md:flex-col", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("max-w-full overflow-hidden pt-1", className)} {...props}>
      {children}
    </div>
  );
}
