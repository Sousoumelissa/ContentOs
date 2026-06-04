"use client";

import { type ReactNode, useMemo, useState } from "react";
import { ArrowLeft, ArrowLeftRight, ArrowRight, Eye, EyeOff, RotateCcw, Search } from "lucide-react";
import { Surface } from "./Surface";
import type { NotionOption } from "@/lib/notion/types";
import { allStatusOptionId } from "@/lib/use-option-order";

export function FilterBar({
  query,
  setQuery,
  account,
  setAccount,
  accountOptions = [],
  status,
  setStatus,
  statuses = [],
  statusCounts = {},
  statusOrderIds = [],
  canEditStatusOrder = false,
  hiddenStatusIds = [],
  onMoveStatus,
  onResetStatusOrder,
  onToggleStatusVisibility,
  onResetStatusVisibility,
  actions
}: {
  query: string;
  setQuery: (value: string) => void;
  account?: string;
  setAccount?: (value: string) => void;
  accountOptions?: string[];
  status?: string;
  setStatus?: (value: string) => void;
  statuses?: NotionOption[];
  statusCounts?: Record<string, number>;
  statusOrderIds?: string[];
  canEditStatusOrder?: boolean;
  hiddenStatusIds?: string[];
  onMoveStatus?: (optionId: string, direction: "left" | "right") => void;
  onResetStatusOrder?: () => void;
  onToggleStatusVisibility?: (optionId: string) => void;
  onResetStatusVisibility?: () => void;
  actions?: ReactNode;
}) {
  const [editingOrder, setEditingOrder] = useState(false);
  const [editingVisibility, setEditingVisibility] = useState(false);
  const hiddenCount = hiddenStatusIds.length;

  const filterItems = useMemo(() => {
    const displayedStatuses = editingVisibility ? statuses : statuses.filter((item) => !hiddenStatusIds.includes(item.id));
    const displayedById = new Map(displayedStatuses.map((item) => [item.id, item]));
    const orderIds = statusOrderIds.length > 0 ? statusOrderIds : [allStatusOptionId, ...statuses.map((item) => item.id)];

    return orderIds
      .map((id) => {
        if (id === allStatusOptionId) return { id, type: "all" as const };
        const option = displayedById.get(id);
        return option ? { id, type: "status" as const, option } : null;
      })
      .filter(Boolean) as Array<{ id: string; type: "all" } | { id: string; type: "status"; option: NotionOption }>;
  }, [editingVisibility, hiddenStatusIds, statuses, statusOrderIds]);

  return (
    <Surface>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-10 min-w-[240px] items-center gap-2 rounded-2xl border border-zinc-100 bg-white px-3">
            <Search size={16} className="text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Chercher..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          {setAccount ? (
            <select
              value={account}
              onChange={(event) => setAccount(event.target.value)}
              className="h-10 w-[160px] rounded-2xl border border-zinc-100 bg-white px-3 text-sm font-semibold outline-none"
            >
              <option>Tous les comptes</option>
              {accountOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          ) : null}
        </div>

        {actions ? <div className="flex flex-wrap items-center gap-2 lg:justify-end">{actions}</div> : null}
      </div>

      {setStatus && status !== undefined && statuses.length > 0 ? (
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1">
          {filterItems.map((item, index) => {
            const isAllButton = item.type === "all";
            const option = item.type === "status" ? item.option : null;
            const label = isAllButton ? "Tout" : option?.name ?? "";
            const isHidden = option ? hiddenStatusIds.includes(option.id) : false;
            const isActive = isAllButton ? status === "Tout" : status === option?.name;
            const count = statusCounts[isAllButton ? "Tout" : label] ?? 0;
            const isFirst = index === 0;
            const isLast = index === filterItems.length - 1;

            return (
              <div key={item.id} className="flex shrink-0 items-center gap-1">
                {editingOrder ? (
                  <button
                    type="button"
                    aria-label={`Deplacer ${label} vers la gauche`}
                    onClick={() => onMoveStatus?.(item.id, "left")}
                    disabled={isFirst}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-100 disabled:opacity-30"
                  >
                    <ArrowLeft size={13} />
                  </button>
                ) : null}

                {editingVisibility && option ? (
                  <button
                    type="button"
                    aria-label={isHidden ? `Afficher ${label}` : `Masquer ${label}`}
                    title={isHidden ? `Afficher ${label}` : `Masquer ${label}`}
                    onClick={() => {
                      onToggleStatusVisibility?.(option.id);
                      if (!isHidden && status === option.name) setStatus("Tout");
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-zinc-100 ${
                      isHidden ? "bg-zinc-50 text-zinc-300" : "bg-white text-zinc-500"
                    }`}
                  >
                    {isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setStatus(isAllButton ? "Tout" : label)}
                  disabled={isHidden}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-black ${
                    isHidden
                      ? "bg-zinc-50 text-zinc-300 line-through ring-1 ring-zinc-100"
                      : isActive
                        ? "bg-zinc-950 text-white"
                        : "bg-white text-zinc-500 ring-1 ring-zinc-100"
                  }`}
                >
                  <span className="max-w-[110px] truncate">{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isActive && !isHidden ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>

                {editingOrder ? (
                  <button
                    type="button"
                    aria-label={`Deplacer ${label} vers la droite`}
                    onClick={() => onMoveStatus?.(item.id, "right")}
                    disabled={isLast}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-400 ring-1 ring-zinc-100 disabled:opacity-30"
                  >
                    <ArrowRight size={13} />
                  </button>
                ) : null}
              </div>
            );
          })}

          {canEditStatusOrder ? (
            <>
              <button
                type="button"
                aria-label="Modifier l'ordre des statuts"
                title="Modifier l'ordre des statuts"
                onClick={() => setEditingOrder((value) => !value)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 ring-zinc-100 ${
                  editingOrder ? "bg-zinc-950 text-white" : "bg-white text-zinc-500"
                }`}
              >
                <ArrowLeftRight size={15} />
              </button>

              {editingOrder ? (
                <button
                  type="button"
                  onClick={onResetStatusOrder}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 text-xs font-black text-zinc-500 ring-1 ring-zinc-100"
                >
                  <RotateCcw size={14} />
                  Reset
                </button>
              ) : null}

              <button
                type="button"
                aria-label="Afficher ou masquer les statuts"
                title="Afficher ou masquer les statuts"
                onClick={() => setEditingVisibility((value) => !value)}
                className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 ring-zinc-100 ${
                  editingVisibility ? "bg-zinc-950 text-white" : "bg-white text-zinc-500"
                }`}
              >
                {hiddenCount > 0 && !editingVisibility ? <EyeOff size={15} /> : <Eye size={15} />}
                {hiddenCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[10px] text-white">
                    {hiddenCount}
                  </span>
                ) : null}
              </button>

              {editingVisibility && hiddenCount > 0 ? (
                <button
                  type="button"
                  onClick={onResetStatusVisibility}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 text-xs font-black text-zinc-500 ring-1 ring-zinc-100"
                >
                  <RotateCcw size={14} />
                  Afficher tout
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </Surface>
  );
}
