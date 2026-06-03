import { AlertTriangle } from "lucide-react";

export function NotionWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="mb-2 flex items-center gap-2 font-black">
        <AlertTriangle size={16} />
        Bases Notion non chargees
      </div>
      <ul className="space-y-1">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
