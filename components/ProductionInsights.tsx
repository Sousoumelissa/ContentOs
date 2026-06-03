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
    <span className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-black ${priorityClasses[priority.level]}`}>
      {priority.label}
      {priority.alerts.length > 0 ? <span className="ml-1 opacity-70">({priority.alerts.length})</span> : null}
    </span>
  );
}

export function AlertList({ alerts, compact = false }: { alerts: ContentAlert[]; compact?: boolean }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
        <CheckCircle2 size={14} />
        Rien a signaler
      </div>
    );
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-2"}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`inline-flex max-w-full items-center gap-2 rounded-2xl px-3 py-2 text-xs font-black ${priorityClasses[alert.level]}`}
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
    <div className="grid gap-2 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className={`rounded-2xl px-3 py-3 ${priorityClasses[item.key]}`}>
          <p className="text-xs font-black">{item.label}</p>
          <p className="mt-1 text-2xl font-black">{counts[item.key]}</p>
        </div>
      ))}
    </div>
  );
}
