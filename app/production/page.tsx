"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { InlineBadgeSelect } from "@/components/InlineBadgeSelect";
import { Modal } from "@/components/Modal";
import { PageTitle } from "@/components/PageTitle";
import { AlertList, PriorityBadge, PrioritySummary, ProductionPhaseBadge } from "@/components/ProductionInsights";
import { Surface } from "@/components/Surface";
import { Tabs } from "@/components/Tabs";
import { WorkCard, contentToCard } from "@/components/WorkCard";
import { patchContent } from "@/lib/api";
import type { Brand, ContentItem, NotionOption } from "@/lib/notion/types";
import { getContentPriority, getPriorityCounts, getProductionPhase, sortByPriority } from "@/lib/production-insights";
import { makeStatusCounts } from "@/lib/status-counts";
import { useBootstrap } from "@/lib/use-bootstrap";
import { useFirstStatusDefault } from "@/lib/use-first-status-default";
import { useOptionOrder } from "@/lib/use-option-order";
import { firstNameFor, includesQuery } from "@/lib/ui-helpers";

// Page Production : elle affiche la base [Content hub].
// Le kanban est genere avec les statuts reels de Notion.
export default function ProductionPage() {
  const { data, error, loading, reload } = useBootstrap();
  const [view, setView] = useState("cards");
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("Tous les comptes");
  const [status, setStatus] = useState("Tout");
  const [sort, setSort] = useState("priority");
  const [message, setMessage] = useState("");
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const [inlineSaving, setInlineSaving] = useState("");
  const statusOrder = useOptionOrder("content-os-status-order-contents", data?.schemas.status.contents ?? []);
  useFirstStatusDefault({ status, setStatus, visibleOptions: statusOrder.visibleOptions, isReady: statusOrder.isHydrated });
  const hiddenContentStatusNames = useMemo(() => new Set(statusOrder.hiddenOptions.map((option) => option.name)), [statusOrder.hiddenOptions]);

  const contentForStatusCounts = useMemo(() => {
    if (!data) return [];
    const selectedBrand = data.brands.find((brand) => brand.name === account);

    return data.contents.filter((item) => {
      const matchQuery = includesQuery([item.title, item.description, item.script, item.status, item.format], query);
      const matchAccount = account === "Tous les comptes" || item.brandIds.includes(selectedBrand?.id ?? "");
      return matchQuery && matchAccount;
    });
  }, [account, data, query]);

  const contentStatusCounts = useMemo(
    () => makeStatusCounts(contentForStatusCounts, (item) => item.status, hiddenContentStatusNames),
    [contentForStatusCounts, hiddenContentStatusNames]
  );

  const items = useMemo(() => {
    if (!data) return [];

    const filtered = contentForStatusCounts.filter((item) => (status === "Tout" ? !hiddenContentStatusNames.has(item.status) : item.status === status));

    if (sort === "priority") return sortByPriority(filtered, data);
    if (sort === "date") return [...filtered].sort((a, b) => (a.date || "9999-99-99").localeCompare(b.date || "9999-99-99"));
    return filtered;
  }, [contentForStatusCounts, data, hiddenContentStatusNames, sort, status]);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  // Sauvegarde la popup Production dans Notion, puis recharge les donnees visibles.
  async function saveContent(payload: {
    pageId: string;
    title: string;
    status: string;
    brandIds: string[];
    format: string;
    script: string;
    description: string;
    canvaUrl: string;
    externalUrl: string;
  }) {
    await patchContent(payload);
    setMessage("Contenu mis a jour dans Notion.");
    setOpenedContent(null);
    await reload();
  }

  async function saveContentInline(item: ContentItem, patch: Partial<Pick<ContentItem, "status" | "format" | "brandIds">>) {
    setInlineSaving(item.id);
    setMessage("");

    try {
      await patchContent({
        pageId: item.id,
        title: item.title,
        status: patch.status ?? item.status,
        brandIds: patch.brandIds ?? item.brandIds,
        format: patch.format ?? item.format,
        script: item.script,
        description: item.description,
        canvaUrl: item.canvaUrl,
        externalUrl: item.externalUrl
      });
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Modification impossible.");
    } finally {
      setInlineSaving("");
    }
  }

  return (
    <section className="space-y-5">
      <PageTitle title="Production" description="Pipeline éditorial de [Content hub]." />

      {message ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">{message}</div> : null}

      <PrioritySummary counts={getPriorityCounts(items, data)} />

      {openedContent ? (
        <ContentPopup
          item={openedContent}
          data={data}
          brands={data.brands}
          statusOptions={statusOrder.orderedOptions}
          formatOptions={data.schemas.format.contents ?? []}
          onClose={() => setOpenedContent(null)}
          onSave={saveContent}
        />
      ) : null}

      <Surface>
        <Tabs
          active={view}
          setActive={setView}
          items={[
            { key: "cards", label: "Cartes" },
            { key: "table", label: "Table" },
            { key: "kanban", label: "Kanban" }
          ]}
        />
        <div className="mt-4">
          <FilterBar
            query={query}
            setQuery={setQuery}
            account={account}
            setAccount={setAccount}
            accountOptions={data.brands.map((brand) => brand.name)}
            status={status}
            setStatus={setStatus}
            statuses={statusOrder.orderedOptions}
            statusCounts={contentStatusCounts}
            statusOrderIds={statusOrder.filterOrderIds}
            canEditStatusOrder
            hiddenStatusIds={statusOrder.hiddenOptionIds}
            onMoveStatus={statusOrder.moveOption}
            onResetStatusOrder={statusOrder.resetOrder}
            onToggleStatusVisibility={statusOrder.toggleOptionVisibility}
            onResetStatusVisibility={statusOrder.resetHiddenOptions}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase text-zinc-400">Tri</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-10 rounded-2xl border border-zinc-100 bg-white px-3 text-sm font-semibold outline-none"
            >
              <option value="priority">Priorite</option>
              <option value="date">Date</option>
              <option value="notion">Ordre Notion</option>
            </select>
          </div>
        </div>
      </Surface>

      {view === "cards" ? (
        <div className="grid min-w-0 gap-3 xl:grid-cols-2">
          {items.length === 0 ? <EmptyState label="Aucun contenu trouve." /> : null}
          {items.map((item) => (
            <WorkCard
              key={item.id}
              item={contentToCard(item, firstNameFor(data, item.brandIds))}
              hideNotionLink
              onOpen={() => setOpenedContent(item)}
              badges={
                <ContentCardBadges
                  item={item}
                  brands={data.brands}
                  statusOptions={statusOrder.orderedOptions}
                  formatOptions={data.schemas.format.contents ?? []}
                  disabled={inlineSaving === item.id}
                  onChange={(patch) => void saveContentInline(item, patch)}
                />
              }
              footer={<AlertList alerts={getContentPriority(item, data).alerts} compact />}
            />
          ))}
        </div>
      ) : null}

      {view === "table" ? <ProductionTable data={data} items={items} onOpen={setOpenedContent} /> : null}
      {view === "kanban" ? (
        <ProductionKanban
          data={data}
          items={items}
          statuses={statusOrder.visibleOptions}
          brands={data.brands}
          statusOptions={statusOrder.orderedOptions}
          formatOptions={data.schemas.format.contents ?? []}
          inlineSaving={inlineSaving}
          onInlineChange={saveContentInline}
          onOpen={setOpenedContent}
        />
      ) : null}
    </section>
  );
}

function ProductionTable({ data, items, onOpen }: { data: any; items: ContentItem[]; onOpen: (item: ContentItem) => void }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="hidden grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_1fr] gap-3 border-b border-zinc-100 px-5 py-3 text-xs font-black uppercase text-zinc-400 md:grid">
        <span>Contenu</span>
        <span>Compte</span>
        <span>Statut</span>
        <span>Format</span>
        <span>Action</span>
      </div>
      <div className="divide-y divide-zinc-100">
        {items.map((item) => (
          <div key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_1fr] md:items-center">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-zinc-950">{item.title}</h3>
              <p className="truncate text-xs font-semibold text-zinc-400">{item.description || item.script || "Sans description"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <ProductionPhaseBadge phase={getProductionPhase(item)} />
                <PriorityBadge priority={getContentPriority(item, data)} />
              </div>
            </div>
            <Badge color="blue">{firstNameFor(data, item.brandIds)}</Badge>
            <Badge color={item.statusColor}>{item.status}</Badge>
            <span className="text-sm font-bold text-zinc-600">{item.format || "-"}</span>
            <div>
              <Button onClick={() => onOpen(item)}>Ouvrir</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductionKanban({
  data,
  items,
  statuses,
  brands,
  statusOptions,
  formatOptions,
  inlineSaving,
  onInlineChange,
  onOpen
}: {
  data: any;
  items: ContentItem[];
  statuses: NotionOption[];
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  inlineSaving: string;
  onInlineChange: (item: ContentItem, patch: Partial<Pick<ContentItem, "status" | "format" | "brandIds">>) => Promise<void>;
  onOpen: (item: ContentItem) => void;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1200px] gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(statuses.length, 1)}, minmax(240px, 1fr))` }}>
        {statuses.map((status: any) => {
          const columnItems = items.filter((item) => item.status === status.name);

          return (
            <div key={status.id} className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
                <Badge color={status.color}>{status.name}</Badge>
                <span className="text-sm font-black text-zinc-500">{columnItems.length}</span>
              </div>
              <div className="min-h-[220px] space-y-2 bg-zinc-50 p-3">
                {columnItems.length === 0 ? <EmptyState label="Aucun contenu" /> : null}
                {columnItems.map((item) => (
                  <WorkCard
                    key={item.id}
                    item={contentToCard(item, firstNameFor(data, item.brandIds))}
                    hideNotionLink
                    onOpen={() => onOpen(item)}
                    badges={
                      <ContentCardBadges
                        item={item}
                        brands={brands}
                        statusOptions={statusOptions}
                        formatOptions={formatOptions}
                        disabled={inlineSaving === item.id}
                        onChange={(patch) => void onInlineChange(item, patch)}
                      />
                    }
                    footer={<AlertList alerts={getContentPriority(item, data).alerts} compact />}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContentCardBadges({
  item,
  brands,
  statusOptions,
  formatOptions,
  disabled,
  onChange
}: {
  item: ContentItem;
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: Partial<Pick<ContentItem, "status" | "format" | "brandIds">>) => void;
}) {
  const selectedStatus = statusOptions.find((option) => option.name === item.status);
  const selectedFormat = formatOptions.find((option) => option.name === item.format);

  return (
    <>
      <InlineBadgeSelect
        label="Compte"
        color="blue"
        value={item.brandIds[0] ?? ""}
        disabled={disabled}
        options={[{ value: "", label: "Aucun compte" }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
        onChange={(value) => onChange({ brandIds: value ? [value] : [] })}
      />
      <InlineBadgeSelect
        label="Statut"
        color={selectedStatus?.color ?? item.statusColor}
        value={item.status}
        disabled={disabled}
        options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
        onChange={(value) => onChange({ status: value })}
      />
      <InlineBadgeSelect
        label="Format"
        color={selectedFormat?.color ?? "default"}
        value={item.format}
        disabled={disabled}
        options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((option) => ({ value: option.name, label: option.name }))]}
        onChange={(value) => onChange({ format: value })}
      />
      <ProductionPhaseBadge phase={getProductionPhase(item)} />
      <PriorityBadge priority={getContentPriority(item)} />
      {item.date ? <Badge color="green">{item.date}</Badge> : null}
    </>
  );
}

function ContentPopup({
  item,
  data,
  brands,
  statusOptions,
  formatOptions,
  onClose,
  onSave
}: {
  item: ContentItem;
  data: any;
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  onClose: () => void;
  onSave: (payload: {
    pageId: string;
    title: string;
    status: string;
    brandIds: string[];
    format: string;
    script: string;
    description: string;
    canvaUrl: string;
    externalUrl: string;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState(item.title);
  const [status, setStatus] = useState(item.status);
  const [brandId, setBrandId] = useState(item.brandIds[0] ?? "");
  const [format, setFormat] = useState(item.format);
  const [script, setScript] = useState(item.script);
  const [description, setDescription] = useState(item.description);
  const [canvaUrl, setCanvaUrl] = useState(item.canvaUrl);
  const [externalUrl, setExternalUrl] = useState(item.externalUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty =
    title !== item.title ||
    status !== item.status ||
    brandId !== (item.brandIds[0] ?? "") ||
    format !== item.format ||
    script !== item.script ||
    description !== item.description ||
    canvaUrl !== item.canvaUrl ||
    externalUrl !== item.externalUrl;

  const selectedBrand = brands.find((brand) => brand.id === brandId);
  const selectedStatus = statusOptions.find((option) => option.name === status);
  const selectedFormat = formatOptions.find((option) => option.name === format);

  // Evite de perdre des modifications en fermant la popup par erreur.
  function requestClose() {
    if (isDirty && !saving && !window.confirm("Des modifications ne sont pas sauvegardees. Fermer quand meme ?")) return;
    onClose();
  }

  // Envoie les valeurs modifiees a l'API, qui les synchronise ensuite avec Notion.
  async function submit() {
    setSaving(true);
    setError("");

    try {
      await onSave({
        pageId: item.id,
        title,
        status,
        brandIds: brandId ? [brandId] : [],
        format,
        script,
        description,
        canvaUrl,
        externalUrl
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={item.title || "Contenu"} onClose={onClose} shouldConfirmClose={isDirty && !saving}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <ProductionPhaseBadge phase={getProductionPhase(item)} />
          <PriorityBadge priority={getContentPriority(item, data)} />
          <BadgeSelect
            label={selectedBrand?.name || "Aucun compte"}
            color="blue"
            value={brandId}
            onChange={setBrandId}
            options={[{ value: "", label: "Aucun compte" }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
          />
          <BadgeSelect
            label={status || "Sans statut"}
            color={selectedStatus?.color ?? "gray"}
            value={status}
            onChange={setStatus}
            options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
          />
          <BadgeSelect
            label={format || "Aucun format"}
            color={selectedFormat?.color ?? "green"}
            value={format}
            onChange={setFormat}
            options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((option) => ({ value: option.name, label: option.name }))]}
          />
        </div>

        <AlertList alerts={getContentPriority(item, data).alerts} compact />

        <PopupBlock>
          <PropertyLine label="ID page">{item.id}</PropertyLine>
          <div className="flex flex-wrap gap-2">
            {item.url ? (
              <a className="rounded-2xl bg-black px-4 py-3 text-sm font-black text-white" href={item.url} target="_blank" rel="noreferrer">
                Ouvrir dans Notion
              </a>
            ) : null}
            {canvaUrl ? (
              <a className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-700" href={canvaUrl} target="_blank" rel="noreferrer">
                Canva
              </a>
            ) : null}
            {externalUrl ? (
              <a className="rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-black text-zinc-700" href={externalUrl} target="_blank" rel="noreferrer">
                Lien source
              </a>
            ) : null}
          </div>
        </PopupBlock>

        <PopupBlock>
          <label className="block text-xs font-black uppercase text-zinc-400">Titre</label>
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-black text-zinc-950 outline-none focus:border-zinc-300"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <label className="mt-4 block text-xs font-black uppercase text-zinc-400">Poste / script</label>
          <textarea
            className="mt-2 min-h-[150px] w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-300"
            value={script}
            onChange={(event) => setScript(event.target.value)}
          />
          <label className="mt-4 block text-xs font-black uppercase text-zinc-400">Description du post</label>
          <textarea
            className="mt-2 min-h-[120px] w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 outline-none focus:border-zinc-300"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </PopupBlock>

        <PopupBlock>
          <label className="block text-xs font-black uppercase text-zinc-400">Lien Canva</label>
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-bold text-zinc-700 outline-none focus:border-zinc-300"
            value={canvaUrl}
            onChange={(event) => setCanvaUrl(event.target.value)}
            placeholder="https://..."
          />
          <label className="mt-4 block text-xs font-black uppercase text-zinc-400">Lien source</label>
          <input
            className="mt-2 w-full rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-bold text-zinc-700 outline-none focus:border-zinc-300"
            value={externalUrl}
            onChange={(event) => setExternalUrl(event.target.value)}
            placeholder="https://..."
          />
        </PopupBlock>

        {error ? <p className="text-sm font-black text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="light" disabled={saving} onClick={requestClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function BadgeSelect({
  label,
  color,
  value,
  options,
  onChange
}: {
  label: string;
  color: NotionOption["color"];
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const colorClass =
    {
      default: "bg-zinc-100 text-zinc-700",
      gray: "bg-zinc-100 text-zinc-700",
      brown: "bg-amber-100 text-amber-800",
      orange: "bg-orange-100 text-orange-700",
      yellow: "bg-yellow-100 text-yellow-700",
      green: "bg-emerald-100 text-emerald-700",
      blue: "bg-blue-100 text-blue-700",
      purple: "bg-violet-100 text-violet-700",
      pink: "bg-pink-100 text-pink-700",
      red: "bg-rose-100 text-rose-700"
    }[color] ?? "bg-zinc-100 text-zinc-700";

  return (
    <label className={`relative inline-flex max-w-full items-center rounded-full px-3 py-1.5 text-xs font-black ${colorClass}`}>
      <span className="truncate">{label}</span>
      <select
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PopupBlock({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl bg-zinc-50 p-4">{children}</div>;
}

function PropertyLine({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-black uppercase text-zinc-400">{label}</p>
      <p className="break-words text-sm font-black text-zinc-800">{children}</p>
    </div>
  );
}
