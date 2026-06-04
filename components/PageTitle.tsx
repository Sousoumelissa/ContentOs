import { Plus } from "lucide-react";
import { Button } from "./Button";

export function PageTitle({
  title,
  description,
  action,
  onAction
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <h2 className="break-words text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">{title}</h2>
        {description ? <p className="mt-1 text-xs font-medium text-zinc-400">{description}</p> : null}
      </div>
      {action ? (
        <Button onClick={onAction} className="ml-auto h-9 min-h-9 shrink-0 whitespace-nowrap rounded-xl px-2.5 py-1.5 sm:px-3">
          <Plus size={15} />
          {action}
        </Button>
      ) : null}
    </div>
  );
}
