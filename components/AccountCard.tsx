"use client";

import { Badge } from "./Badge";
import { Card, CardBadges, CardHeader, CardStats, CardTitle } from "./Card";
import { InlineBadgeSelect } from "./InlineBadgeSelect";
import type { AccountStats } from "@/lib/account-stats";
import type { Brand, NotionOption } from "@/lib/notion/types";

export function AccountCard({
  account,
  stats,
  statusOptions,
  statusDisabled = false,
  onOpen,
  onStatusChange
}: {
  account: Brand;
  stats: AccountStats;
  statusOptions: NotionOption[];
  statusDisabled?: boolean;
  onOpen: () => void;
  onStatusChange: (nextStatus: string) => void;
}) {
  return (
    <Card
      interactive
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <CardHeader>
        <div className="min-w-0">
          <CardBadges className="mb-2">
            {account.platforms.map((platform) => (
              <Badge key={platform} color="purple">{platform}</Badge>
            ))}
          </CardBadges>
          <CardTitle className="line-clamp-1">{account.name}</CardTitle>
        </div>

        <div className="shrink-0" onClick={(event) => event.stopPropagation()}>
          <InlineBadgeSelect
            label="Statut"
            color={account.statusColor}
            value={account.status}
            disabled={statusDisabled}
            options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
            onChange={onStatusChange}
          />
        </div>
      </CardHeader>

      <CardStats className="mb-2">
        <MiniStat label="inputs" value={stats.inputs} />
        <MiniStat label="a traiter" value={stats.toProcess} />
        <MiniStat label="prod" value={stats.production} />
        <MiniStat label="prets" value={stats.readyOrPublished} />
      </CardStats>

      <div className="space-y-1 text-sm text-zinc-500">
        <p className="line-clamp-1 break-words">
          <span className="font-bold text-zinc-700">Niche :</span> {account.niche || "Niche non renseignee"}
        </p>
        <p className="line-clamp-1 break-words">
          <span className="font-bold text-zinc-700">Cible :</span> {account.target || "Cible non renseignee"}
        </p>
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-1.5 py-1.5 text-center">
      <p className="text-base font-black leading-none text-zinc-950">{value}</p>
      <p className="mt-0.5 truncate text-[10px] font-bold text-zinc-400">{label}</p>
    </div>
  );
}
