import type { HTMLAttributes } from "react";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

// Bloc blanc de base pour les filtres, sections et panneaux.
// Comme Card, il protege le layout mobile des contenus trop larges.
export function Surface({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={classNames("w-full min-w-0 max-w-full overflow-hidden rounded-3xl bg-white p-4 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}
