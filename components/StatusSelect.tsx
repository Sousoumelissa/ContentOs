"use client";

import { useState } from "react";
import { patchStatus } from "@/lib/api";
import type { DatabaseKey, NotionOption } from "@/lib/notion/types";

export function StatusSelect({
  database,
  pageId,
  value,
  options,
  onDone
}: {
  database: DatabaseKey;
  pageId: string;
  value: string;
  options: NotionOption[];
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function updateStatus(nextStatus: string) {
    if (nextStatus === value) return;
    setSaving(true);
    setMessage("");

    try {
      await patchStatus(database, pageId, nextStatus);
      await onDone();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Statut non modifie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-[150px]">
      <select
        value={value}
        disabled={saving || options.length === 0}
        onChange={(event) => void updateStatus(event.target.value)}
        className="h-9 w-full rounded-2xl border border-zinc-100 bg-white px-2 text-xs font-black text-zinc-700 outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
      {message ? <p className="mt-1 text-[11px] font-bold text-rose-600">{message}</p> : null}
    </div>
  );
}
