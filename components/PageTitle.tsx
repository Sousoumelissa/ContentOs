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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-zinc-950">{title}</h2>
      {description ? <p className="mt-1 text-xs font-medium text-zinc-400">{description}</p> : null}
      </div>
      {action ? (
        <Button onClick={onAction} className="self-start sm:self-auto">
          <Plus size={15} />
          {action}
        </Button>
      ) : null}
    </div>
  );
}
