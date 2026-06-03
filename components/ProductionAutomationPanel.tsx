import { Play } from "lucide-react";
import { Button } from "./Button";

type ProductionAutomationPanelProps = {
  count: number;
  isRunning: boolean;
  onLaunch: () => void;
};

// Petite action de production : elle reste discrete pour ne pas voler la place aux cartes.
export function ProductionAutomationPanel({ count, isRunning, onLaunch }: ProductionAutomationPanelProps) {
  if (count === 0) return null;

  return (
    <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-100 bg-white px-2.5 py-2 shadow-sm">
      <span className="whitespace-nowrap text-xs font-black text-zinc-500">
        {count} Validate
      </span>
      <Button className="min-h-8 rounded-full px-3 py-1.5" disabled={isRunning} onClick={onLaunch}>
        <Play size={14} />
        {isRunning ? "Lancement..." : "Lancer scripts"}
      </Button>
    </div>
  );
}
