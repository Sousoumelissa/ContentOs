import type { OptionColor } from "@/lib/notion/types";

const colorClasses: Record<OptionColor | "default", string> = {
  default: "bg-zinc-100 text-zinc-700",
  gray: "bg-zinc-100 text-zinc-700",
  brown: "bg-stone-100 text-stone-700",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-violet-100 text-violet-700",
  pink: "bg-pink-100 text-pink-700",
  red: "bg-rose-100 text-rose-700"
};

export function Badge({
  children,
  color = "default"
}: {
  children: React.ReactNode;
  color?: OptionColor | "default";
}) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-bold ${colorClasses[color]}`}>
      <span className="truncate">{children}</span>
    </span>
  );
}
