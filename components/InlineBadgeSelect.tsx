import type { OptionColor } from "@/lib/notion/types";

type InlineBadgeSelectProps = {
  label: string;
  value: string;
  color?: OptionColor | "default";
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

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

// Select compact qui ressemble a un badge Notion.
// Le stopPropagation permet de modifier une carte sans ouvrir sa popup.
export function InlineBadgeSelect({ label, value, color = "default", options, disabled = false, onChange }: InlineBadgeSelectProps) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? label;

  return (
    <label
      className={`relative inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-bold ${colorClasses[color]}`}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="max-w-[160px] truncate">{selectedLabel}</span>
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
