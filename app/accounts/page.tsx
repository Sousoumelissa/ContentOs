"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/Badge";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { PageTitle } from "@/components/PageTitle";
import { StatusSelect } from "@/components/StatusSelect";
import { makeStatusCounts } from "@/lib/status-counts";
import { useBootstrap } from "@/lib/use-bootstrap";
import { useFirstStatusDefault } from "@/lib/use-first-status-default";
import { useOptionOrder } from "@/lib/use-option-order";
import { includesQuery, inputBelongsToBrand } from "@/lib/ui-helpers";

// Page Comptes : elle affiche la base Notion [Brands].
// Les statuts viennent de Notion, pas d'un tableau code en dur.
export default function AccountsPage() {
  const router = useRouter();
  const { data, error, loading, reload } = useBootstrap();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Tout");
  const statusOrder = useOptionOrder("content-os-status-order-brands", data?.schemas.status.brands ?? []);
  useFirstStatusDefault({ status, setStatus, visibleOptions: statusOrder.visibleOptions, isReady: statusOrder.isHydrated });
  const hiddenBrandStatusNames = useMemo(() => new Set(statusOrder.hiddenOptions.map((option) => option.name)), [statusOrder.hiddenOptions]);

  const accountsForStatusCounts = useMemo(() => {
    if (!data) return [];

    return data.brands.filter((account) => {
      const matchQuery = includesQuery([account.name, account.niche, account.target, account.status], query);
      return matchQuery;
    });
  }, [data, query]);

  const brandStatusCounts = useMemo(
    () => makeStatusCounts(accountsForStatusCounts, (account) => account.status, hiddenBrandStatusNames),
    [accountsForStatusCounts, hiddenBrandStatusNames]
  );

  const items = useMemo(() => {
    return accountsForStatusCounts.filter((account) => (status === "Tout" ? !hiddenBrandStatusNames.has(account.status) : account.status === status));
  }, [accountsForStatusCounts, hiddenBrandStatusNames, status]);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  return (
    <section className="space-y-5">
      <PageTitle title="Comptes" description="Chaque carte vient de la base [Brands]." action="Nouveau compte" />
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
          <div
            key={account.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/accounts/${account.id}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push(`/accounts/${account.id}`);
              }
            }}
            className="group w-full cursor-pointer overflow-hidden rounded-3xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-950/20"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge color="blue">@{account.name.toLowerCase().replaceAll(" ", "")}</Badge>
                  <Badge color="blue">{account.niche || "Niche vide"}</Badge>
                  {account.platforms.length ? <Badge color="purple">{account.platforms.length} plateformes</Badge> : null}
                </div>
                <h3 className="truncate text-base font-black text-zinc-950">{account.name}</h3>
              </div>
              <Badge color={account.statusColor}>{account.status || "Sans statut"}</Badge>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-2 rounded-2xl bg-zinc-50 p-2">
              <MiniStat label="inputs" value={data.inputs.filter((item) => inputBelongsToBrand(item, account, data)).length} />
              <MiniStat label="à traiter" value={data.inputs.filter((item) => inputBelongsToBrand(item, account, data) && !["Done", "Abandon"].includes(item.status)).length} />
              <MiniStat label="prod" value={data.contents.filter((item) => item.brandIds.includes(account.id) && ["Script", "Visuel", "Description"].includes(item.status)).length} />
              <MiniStat label="prêts" value={data.contents.filter((item) => item.brandIds.includes(account.id) && ["Prete", "Planifier", "Posté"].includes(item.status)).length} />
            </div>

            <p className="mb-3 line-clamp-2 text-sm text-zinc-500">{account.target || "Cible non renseignée"}</p>

            <div onClick={(event) => event.stopPropagation()}>
              <StatusSelect
                database="brands"
                pageId={account.id}
                value={account.status}
                options={statusOrder.orderedOptions}
                onDone={reload}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white px-2 py-2 text-center">
      <p className="text-lg font-black leading-none text-zinc-950">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-zinc-400">{label}</p>
    </div>
  );
}
