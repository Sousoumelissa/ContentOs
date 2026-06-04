import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "./Badge";
import type { ContentAlert, ContentPriority, PriorityLevel, ProductionPhase } from "@/lib/production-insights";

const priorityClasses: Record<PriorityLevel, string> = {
  red: "bg-rose-100 text-rose-700",
  orange: "bg-orange-100 text-orange-700",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700"
};

export function ProductionPhaseBadge({ phase }: { phase: ProductionPhase }) {
  return <Badge color={phase.color}>{phase.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: ContentPriority }) {
  if (priority.level === "green") return null;

  return (
    <span className={`inline-flex min-w-0 max-w-full items-center rounded-full px-3 py-1 text-xs font-black ${priorityClasses[priority.level]}`}>
      <span className="truncate">{priority.label}</span>
      {priority.alerts.length > 0 ? <span className="ml-1 opacity-70">({priority.alerts.length})</span> : null}
    </span>
  );
}

export function AlertList({ alerts, compact = false }: { alerts: ContentAlert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <div className="flex max-w-full items-center gap-2 overflow-hidden rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        <span className="truncate">Rien a signaler</span>
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`inline-flex min-w-0 max-w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ${priorityClasses[alert.level]}`}
        >
          <AlertTriangle size={14} />
          <span className="truncate">{alert.label}</span>
        </div>
      ))}
    </div>
  );
}

export function PrioritySummary({ counts }: { counts: Record<PriorityLevel, number> }) {
  const items: Array<{ key: PriorityLevel; label: string }> = [
    { key: "red", label: "Urgent" },
    { key: "orange", label: "A traiter" },
    { key: "yellow", label: "A completer" },
    { key: "green", label: "OK" }
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <div key={item.key} className={`min-w-0 rounded-2xl px-2 py-2 sm:px-3 sm:py-3 ${priorityClasses[item.key]}`}>
          <p className="truncate text-[10px] font-black leading-tight sm:text-xs">{item.label}</p>
          <p className="mt-1 text-xl font-black leading-none sm:text-2xl">{counts[item.key]}</p>
        </div>
      ))}
    </div>
  );
}
