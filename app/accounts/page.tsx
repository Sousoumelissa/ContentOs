"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { AccountCard } from "@/components/AccountCard";
import { Button } from "@/components/Button";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { Modal } from "@/components/Modal";
import { getAccountStats } from "@/lib/account-stats";
import { patchStatus, postAccount } from "@/lib/api";
import { makeStatusCounts } from "@/lib/status-counts";
import { useBootstrap } from "@/lib/use-bootstrap";
import { useFirstStatusDefault } from "@/lib/use-first-status-default";
import { useOptionOrder } from "@/lib/use-option-order";
import { includesQuery } from "@/lib/ui-helpers";
import type { NotionOption, Platform } from "@/lib/notion/types";

// Page Comptes : elle affiche la base Notion [Brands].
// Les cartes et les stats sont partagees pour garder le meme comportement ailleurs.
export default function AccountsPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useBootstrap();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tout");
  const [savingStatusId, setSavingStatusId] = useState("");
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [message, setMessage] = useState("");
  const statusOrder = useOptionOrder("content-os-status-order-brands", data?.schemas.status.brands ?? []);
  useFirstStatusDefault({ status, setStatus, visibleOptions: statusOrder.visibleOptions, isReady: statusOrder.isHydrated });
  const hiddenBrandStatusNames = useMemo(() => new Set(statusOrder.hiddenOptions.map((option) => option.name)), [statusOrder.hiddenOptions]);

  const accountsForStatusCounts = useMemo(() => {
    if (!data) return [];

    return data.brands.filter((account) => includesQuery([account.name, account.niche, account.target, account.status], query));
  }, [data, query]);

  const brandStatusCounts = useMemo(
    () => makeStatusCounts(accountsForStatusCounts, (account) => account.status, hiddenBrandStatusNames),
    [accountsForStatusCounts, hiddenBrandStatusNames]
  );

  const items = useMemo(() => {
    return accountsForStatusCounts.filter((account) => (status === "Tout" ? !hiddenBrandStatusNames.has(account.status) : account.status === status));
  }, [accountsForStatusCounts, hiddenBrandStatusNames, status]);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  // Modifie le statut du compte depuis le badge a droite de la carte.
  async function saveAccountStatus(pageId: string, nextStatus: string) {
    setSavingStatusId(pageId);

    try {
      await patchStatus("brands", pageId, nextStatus);
      await reload();
    } finally {
      setSavingStatusId("");
    }
  }

  async function createAccount(payload: {
    name: string;
    status?: string;
    niche?: string;
    target?: string;
    tone?: string;
    platformIds?: string[];
  }) {
    const result = await postAccount(payload);
    setMessage(result.message);
    setShowNewAccount(false);
    await reload();
  }

  return (
    <section className="space-y-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-xl font-black tracking-tight text-zinc-950 sm:text-2xl">Comptes</h2>
          <p className="mt-1 text-xs font-medium text-zinc-400">Chaque carte vient de la base [Brands].</p>
        </div>
        <Button onClick={() => setShowNewAccount(true)} className="ml-auto h-9 min-h-9 shrink-0 whitespace-nowrap rounded-xl px-2.5 py-1.5 sm:px-3">
          <Plus size={15} />
          Nouveau compte
        </Button>
      </div>

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</div> : null}

      {showNewAccount ? (
        <NewAccountModal
          statusOptions={statusOrder.orderedOptions}
          platforms={data.platforms}
          onCreate={createAccount}
          onClose={() => setShowNewAccount(false)}
        />
      ) : null}

      <FilterBar
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        statuses={statusOrder.orderedOptions}
        statusCounts={brandStatusCounts}
        statusOrderIds={statusOrder.filterOrderIds}
        canEditStatusOrder
        hiddenStatusIds={statusOrder.hiddenOptionIds}
        onMoveStatus={statusOrder.moveOption}
        onResetStatusOrder={statusOrder.resetOrder}
        onToggleStatusVisibility={statusOrder.toggleOptionVisibility}
        onResetStatusVisibility={statusOrder.resetHiddenOptions}
      />

      {items.length === 0 ? <EmptyState label="Aucun compte trouve." /> : null}

      <div className="grid gap-3 xl:grid-cols-3">
        {items.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            stats={getAccountStats(account, data)}
            statusOptions={statusOrder.orderedOptions}
            statusDisabled={savingStatusId === account.id}
            onOpen={() => router.push(`/accounts/${account.id}`)}
            onStatusChange={(nextStatus) => void saveAccountStatus(account.id, nextStatus)}
          />
        ))}
      </div>
    </section>
  );
}

function NewAccountModal({
  statusOptions,
  platforms,
  onCreate,
  onClose
}: {
  statusOptions: NotionOption[];
  platforms: Platform[];
  onCreate: (payload: {
    name: string;
    status?: string;
    niche?: string;
    target?: string;
    tone?: string;
    platformIds?: string[];
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState(statusOptions[0]?.name ?? "");
  const [niche, setNiche] = useState("");
  const [target, setTarget] = useState("");
  const [tone, setTone] = useState("");
  const [platformIds, setPlatformIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty = Boolean(name || niche || target || tone || platformIds.length > 0);

  function togglePlatform(platformId: string) {
    setPlatformIds((current) => (current.includes(platformId) ? current.filter((id) => id !== platformId) : [...current, platformId]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onCreate({
        name,
        status,
        niche,
        target,
        tone,
        platformIds
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Compte non cree.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Nouveau compte" onClose={onClose} shouldConfirmClose={isDirty && !saving}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DraftField label="Nom" placeholder="Nom du compte" value={name} onChange={setName} required />
          <label className="block rounded-2xl bg-zinc-50 p-4">
            <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Statut</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full bg-transparent text-sm font-bold text-zinc-700 outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <DraftField label="Niche" placeholder="Niche ou angle principal" value={niche} onChange={setNiche} />
        <DraftField label="Cible" placeholder="Audience visee" value={target} onChange={setTarget} />
        <DraftField label="Ton" placeholder="Ton du compte" value={tone} onChange={setTone} />

        {platforms.length ? (
          <div className="rounded-2xl bg-zinc-50 p-4">
            <p className="mb-3 text-xs font-black uppercase text-zinc-400">Plateformes</p>
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => {
                const selected = platformIds.includes(platform.id);

                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => togglePlatform(platform.id)}
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      selected ? "bg-zinc-950 text-white" : "bg-white text-zinc-600 ring-1 ring-zinc-100"
                    }`}
                  >
                    {platform.name}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm font-black text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="light" disabled={saving} onClick={onClose}>
            Fermer
          </Button>
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Creation..." : "Creer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DraftField({
  label,
  placeholder,
  value,
  onChange,
  required = false
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block rounded-2xl bg-zinc-50 p-4">
      <span className="mb-2 block text-xs font-black uppercase text-zinc-400">{label}</span>
      <input
        className="w-full bg-transparent text-sm font-bold text-zinc-700 outline-none"
        placeholder={placeholder}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
