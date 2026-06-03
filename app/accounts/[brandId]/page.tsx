"use client";

import Link from "next/link";
import { type FormEvent, use, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Play } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { InlineBadgeSelect } from "@/components/InlineBadgeSelect";
import { Modal } from "@/components/Modal";
import { AlertList, PriorityBadge, PrioritySummary, ProductionPhaseBadge } from "@/components/ProductionInsights";
import { Tabs } from "@/components/Tabs";
import { WorkCard, contentToCard, inputToCard } from "@/components/WorkCard";
import { patchContent, patchInput, patchStatus, postContentFromInput, postProductionAutomation } from "@/lib/api";
import { getInputStatusCorrection, inputStatusCorrectionMessage } from "@/lib/input-readiness";
import type { BootstrapData, Brand, ContentItem, InputContent, NotionOption, Source } from "@/lib/notion/types";
import { getContentPriority, getPriorityCounts, getProductionPhase, sortByPriority } from "@/lib/production-insights";
import { makeStatusCounts } from "@/lib/status-counts";
import { useBootstrap } from "@/lib/use-bootstrap";
import { useFirstStatusDefault } from "@/lib/use-first-status-default";
import { useOptionOrder } from "@/lib/use-option-order";
import { firstNameFor, includesQuery, inputBelongsToBrand, inputBrandId, inputBrandName } from "@/lib/ui-helpers";

export default function AccountDetailPage({ params }: { params: Promise<{ brandId: string }> }) {
  const { data, error, loading, reload } = useBootstrap();
  const [tab, setTab] = useState("overview");
  const [message, setMessage] = useState("");
  const [inputQuery, setInputQuery] = useState("");
  const [inputStatus, setInputStatus] = useState("Tout");
  const [pendingAction, setPendingAction] = useState("");
  const [inlineSaving, setInlineSaving] = useState("");
  const [launchingAutomation, setLaunchingAutomation] = useState(false);
  const [correctingStatuses, setCorrectingStatuses] = useState(false);
  const [openedInput, setOpenedInput] = useState<InputContent | null>(null);
  const [openedContent, setOpenedContent] = useState<ContentItem | null>(null);
  const inputStatusOrder = useOptionOrder("content-os-status-order-inputs", data?.schemas.status.inputs ?? []);
  useFirstStatusDefault({ status: inputStatus, setStatus: setInputStatus, visibleOptions: inputStatusOrder.visibleOptions, isReady: inputStatusOrder.isHydrated });
  const hiddenInputStatusNames = useMemo(() => new Set(inputStatusOrder.hiddenOptions.map((option) => option.name)), [inputStatusOrder.hiddenOptions]);

  const { brandId } = use(params);
  const brand = data?.brands.find((item) => item.id === brandId);

  const accountData = useMemo(() => {
    if (!data || !brand) return null;

    const inputs = data.inputs.filter((input) => inputBelongsToBrand(input, brand, data));
    const inputIds = new Set(inputs.map((input) => input.id));
    const contents = data.contents.filter((content) => content.brandIds.includes(brand.id));
    const sources = data.sources.filter((source) => {
      return source.brandIds.includes(brand.id) || source.inputIds.some((inputId) => inputIds.has(inputId));
    });
    const platforms = data.platforms.filter((platform) => platform.brandIds.includes(brand.id));

    return {
      inputs,
      contents,
      sortedContents: sortByPriority(contents, data),
      sources,
      platforms,
      priorityCounts: getPriorityCounts(contents, data)
    };
  }, [brand, data]);

  const inputsForStatusCounts = useMemo(() => {
    if (!accountData) return [];

    return accountData.inputs.filter((input) => {
      const matchQuery = includesQuery([input.title, input.details, input.script, input.status, input.accountName], inputQuery);
      return matchQuery;
    });
  }, [accountData, inputQuery]);

  const inputStatusCounts = useMemo(
    () => makeStatusCounts(inputsForStatusCounts, (input) => input.status, hiddenInputStatusNames),
    [hiddenInputStatusNames, inputsForStatusCounts]
  );

  const filteredInputs = useMemo(() => {
    return inputsForStatusCounts.filter((input) => (inputStatus === "Tout" ? !hiddenInputStatusNames.has(input.status) : input.status === inputStatus));
  }, [hiddenInputStatusNames, inputStatus, inputsForStatusCounts]);

  const statusCorrections = useMemo(() => {
    if (!data) return [];

    return inputsForStatusCounts
      .map((input) => ({ input, correction: getInputStatusCorrection(data, input, brandId) }))
      .filter((item) => item.correction !== null);
  }, [brandId, data, inputsForStatusCounts]);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  if (!brand || !accountData) {
    return (
      <section className="space-y-5">
        <BackLink />
        <EmptyState label="Compte introuvable." />
      </section>
    );
  }

  const urgentItems = accountData.sortedContents.filter((item) => getContentPriority(item, data).weight >= 2);
  const validateInputs = inputsForStatusCounts.filter((input) => input.status === "Validate");

  async function validateInput(inputId: string) {
    const currentData = data;
    const currentAccountData = accountData;
    if (!currentData || !currentAccountData) return;

    setMessage("");
    setPendingAction(`validate:${inputId}`);

    try {
      const input = currentAccountData.inputs.find((item) => item.id === inputId);
      const correction = input ? getInputStatusCorrection(currentData, input, brandId) : null;

      if (correction) {
        await patchStatus("inputs", inputId, correction.targetStatus);
        setMessage(inputStatusCorrectionMessage(correction));
        await reload();
        return;
      }

      await postContentFromInput(inputId, "Validate", [brandId]);
      setMessage("Contenu cree dans Notion depuis cette inspiration.");
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setPendingAction("");
    }
  }

  async function rejectInput(inputId: string) {
    setMessage("");
    setPendingAction(`reject:${inputId}`);

    try {
      await patchStatus("inputs", inputId, "Abandon");
      setMessage("Inspiration rejetee dans Notion.");
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setPendingAction("");
    }
  }

  async function launchProductionAutomation() {
    setMessage("");
    setLaunchingAutomation(true);

    try {
      const result = await postProductionAutomation({
        brandId,
        inputIds: validateInputs.map((input) => input.id)
      });
      if (!result.ok) setMessage(result.message);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Webhook impossible a lancer.");
    } finally {
      setLaunchingAutomation(false);
    }
  }

  async function applyStatusCorrections() {
    setMessage("");
    setCorrectingStatuses(true);

    try {
      if (statusCorrections.length === 0) {
        setMessage("");
        return;
      }

      await Promise.all(
        statusCorrections.map(({ input, correction }) => {
          if (!correction) return Promise.resolve();
          return patchStatus("inputs", input.id, correction.targetStatus);
        })
      );
      setMessage(`${statusCorrections.length} inspiration${statusCorrections.length > 1 ? "s" : ""} rangee${statusCorrections.length > 1 ? "s" : ""} selon les infos manquantes.`);
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Correction impossible.");
    } finally {
      setCorrectingStatuses(false);
    }
  }

  async function saveInput(payload: {
    pageId: string;
    title: string;
    details: string;
    brandIds: string[];
    sourceIds: string[];
    formats: string[];
    status?: string;
  }) {
    await patchInput(payload);
    setMessage("Inspiration mise a jour dans Notion.");
    setOpenedInput(null);
    await reload();
  }

  async function saveInputInline(item: InputContent, patch: Partial<Pick<InputContent, "brandIds" | "sourceIds" | "formats" | "status">>) {
    setInlineSaving(item.id);
    setMessage("");

    try {
      await patchInput({
        pageId: item.id,
        title: item.title,
        details: item.details,
        brandIds: patch.brandIds ?? item.brandIds,
        sourceIds: patch.sourceIds ?? item.sourceIds,
        formats: patch.formats ?? item.formats,
        status: patch.status ?? item.status
      });
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Modification impossible.");
    } finally {
      setInlineSaving("");
    }
  }

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
      <BackLink />
      <AccountHeader brand={brand} />

      {message ? <div className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-zinc-700 shadow-sm">{message}</div> : null}

      {openedInput ? (
        <InputPopup
          item={openedInput}
          brands={data.brands}
          sources={data.sources}
          defaultBrandId={brand.id}
          formatOptions={data.schemas.format.inputs ?? []}
          statusOptions={data.schemas.status.inputs ?? []}
          onSave={saveInput}
          onClose={() => setOpenedInput(null)}
        />
      ) : null}

      {openedContent ? (
        <ContentPopup
          item={openedContent}
          data={data}
          brands={data.brands}
          statusOptions={data.schemas.status.contents ?? []}
          formatOptions={data.schemas.format.contents ?? []}
          onSave={saveContent}
          onClose={() => setOpenedContent(null)}
        />
      ) : null}

      <Tabs
        active={tab}
        setActive={setTab}
        items={[
          { key: "overview", label: "Pilotage" },
          { key: "production", label: "Production" },
          { key: "ideas", label: "Inspirations" },
          { key: "sources", label: "Sources" }
        ]}
      />

      {tab === "overview" ? (
        <div className="space-y-5">
          <PrioritySummary counts={accountData.priorityCounts} />
          <AccountOverview brand={brand} data={data} contents={accountData.sortedContents} sources={accountData.sources} />
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="A traiter maintenant" count={urgentItems.length} />
            <ContentList
              data={data}
              items={urgentItems.slice(0, 8)}
              emptyLabel="Aucun contenu urgent pour ce compte."
              brands={data.brands}
              statusOptions={data.schemas.status.contents ?? []}
              formatOptions={data.schemas.format.contents ?? []}
              inlineSaving={inlineSaving}
              onInlineChange={saveContentInline}
              onOpen={setOpenedContent}
            />
          </section>
          <section className="rounded-3xl bg-white p-5 shadow-sm">
            <SectionTitle title="Inspirations a produire" count={accountData.inputs.filter((input) => !["Done", "Abandon"].includes(input.status)).length} />
            <InputList
              data={data}
              brand={brand}
              inputs={accountData.inputs.filter((input) => !["Done", "Abandon"].includes(input.status)).slice(0, 6)}
              brands={data.brands}
              sources={data.sources}
              statusOptions={inputStatusOrder.orderedOptions}
              formatOptions={data.schemas.format.inputs ?? []}
              inlineSaving={inlineSaving}
              onInlineChange={saveInputInline}
              pendingAction={pendingAction}
              onOpen={setOpenedInput}
              onReject={rejectInput}
              onValidate={validateInput}
            />
          </section>
        </div>
      ) : null}

      {tab === "production" ? (
        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <SectionTitle title="Production priorisee" count={accountData.contents.length} />
          <ContentList
            data={data}
            items={accountData.sortedContents}
            emptyLabel="Aucun contenu production relie."
            brands={data.brands}
            statusOptions={data.schemas.status.contents ?? []}
            formatOptions={data.schemas.format.contents ?? []}
            inlineSaving={inlineSaving}
            onInlineChange={saveContentInline}
            onOpen={setOpenedContent}
          />
        </section>
      ) : null}

      {tab === "ideas" ? (
        <section className="space-y-4">
          <FilterBar
            query={inputQuery}
            setQuery={setInputQuery}
            status={inputStatus}
            setStatus={setInputStatus}
            statuses={inputStatusOrder.orderedOptions}
            statusCounts={inputStatusCounts}
            statusOrderIds={inputStatusOrder.filterOrderIds}
            canEditStatusOrder
            hiddenStatusIds={inputStatusOrder.hiddenOptionIds}
            onMoveStatus={inputStatusOrder.moveOption}
            onResetStatusOrder={inputStatusOrder.resetOrder}
            onToggleStatusVisibility={inputStatusOrder.toggleOptionVisibility}
            onResetStatusVisibility={inputStatusOrder.resetHiddenOptions}
            actions={
              <>
                <Button variant="light" disabled={correctingStatuses} onClick={() => void applyStatusCorrections()}>
                  {correctingStatuses ? "Correction..." : "Verifier"}
                </Button>
                {validateInputs.length > 0 ? (
                  <Button variant="light" disabled={launchingAutomation} onClick={() => void launchProductionAutomation()}>
                    <Play size={14} />
                    {launchingAutomation ? "Lancement..." : "Lancer scripts"}
                  </Button>
                ) : null}
              </>
            }
          />
          <InputList
            data={data}
            brand={brand}
            inputs={filteredInputs}
            brands={data.brands}
            sources={data.sources}
            statusOptions={inputStatusOrder.orderedOptions}
            formatOptions={data.schemas.format.inputs ?? []}
            inlineSaving={inlineSaving}
            onInlineChange={saveInputInline}
            pendingAction={pendingAction}
            onOpen={setOpenedInput}
            onReject={rejectInput}
            onValidate={validateInput}
            />
        </section>
      ) : null}

      {tab === "sources" ? <SourceList sources={accountData.sources} /> : null}
    </section>
  );
}

function BackLink() {
  return (
    <Link href="/accounts" className="inline-flex items-center gap-2 text-xs font-black text-zinc-500 hover:text-zinc-950">
      <ArrowLeft size={14} />
      Retour aux comptes
    </Link>
  );
}

function AccountHeader({ brand }: { brand: Brand }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge color={brand.statusColor}>{brand.status || "Sans statut"}</Badge>
            {brand.niche ? <Badge color="blue">Niche renseignee</Badge> : <Badge color="orange">Niche vide</Badge>}
            {brand.platforms.length ? <Badge color="purple">{brand.platforms.length} plateformes</Badge> : <Badge color="yellow">Aucune plateforme</Badge>}
          </div>
          <h1 className="truncate text-3xl font-black text-zinc-950">{brand.name}</h1>
          <p className="mt-2 max-w-4xl whitespace-pre-wrap text-sm leading-6 text-zinc-600">{brand.target || "Cible non renseignee."}</p>
        </div>
        <a href={brand.url} target="_blank" rel="noreferrer">
          <Button variant="light">
            <ExternalLink size={14} />
            Notion
          </Button>
        </a>
      </div>
    </section>
  );
}

function AccountOverview({
  brand,
  data,
  contents,
  sources
}: {
  brand: Brand;
  data: BootstrapData;
  contents: ContentItem[];
  sources: Source[];
}) {
  const published = contents.filter((item) => getProductionPhase(item).key === "published").length;
  const ready = contents.filter((item) => ["ready", "scheduled"].includes(getProductionPhase(item).key)).length;

  return (
    <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <SectionTitle title="Carte du compte" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MiniMetric label="Production" value={contents.length} />
          <MiniMetric label="Prets / programmes" value={ready} />
          <MiniMetric label="Publies" value={published} />
          <MiniMetric label="Sources" value={sources.length} />
        </div>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-sm">
        <SectionTitle title="Alertes compte" />
        <div className="mt-4">
          <AlertList
            alerts={[
              ...(!brand.niche ? [{ id: "brand-niche", label: "Niche du compte manquante", level: "yellow" as const }] : []),
              ...(!brand.target ? [{ id: "brand-target", label: "Cible du compte manquante", level: "orange" as const }] : []),
              ...(!brand.tone ? [{ id: "brand-tone", label: "Ton du compte manquant", level: "yellow" as const }] : []),
              ...(brand.platforms.length === 0 ? [{ id: "brand-platforms", label: "Aucune plateforme reliee", level: "orange" as const }] : [])
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function ContentList({
  data,
  items,
  emptyLabel,
  brands,
  statusOptions,
  formatOptions,
  inlineSaving,
  onInlineChange,
  onOpen
}: {
  data: BootstrapData;
  items: ContentItem[];
  emptyLabel: string;
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  inlineSaving: string;
  onInlineChange: (item: ContentItem, patch: Partial<Pick<ContentItem, "status" | "format" | "brandIds">>) => Promise<void>;
  onOpen: (item: ContentItem) => void;
}) {
  if (items.length === 0) return <EmptyState label={emptyLabel} />;

  return (
    <div className="mt-4 space-y-3">
      {items.map((item) => {
        const priority = getContentPriority(item, data);

        return (
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
            footer={<AlertList alerts={priority.alerts} compact />}
          />
        );
      })}
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
    </>
  );
}

function InputCardBadges({
  item,
  data,
  brands,
  sources,
  statusOptions,
  formatOptions,
  disabled,
  onChange
}: {
  item: InputContent;
  data: BootstrapData;
  brands: Brand[];
  sources: Source[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: Partial<Pick<InputContent, "brandIds" | "sourceIds" | "formats" | "status">>) => void;
}) {
  const selectedStatus = statusOptions.find((option) => option.name === item.status);
  const selectedFormat = formatOptions.find((option) => option.name === item.formats[0]);

  return (
    <>
      <InlineBadgeSelect
        label="Compte"
        color="blue"
        value={inputBrandId(data, item)}
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
        label="Source"
        color="purple"
        value={item.sourceIds[0] ?? ""}
        disabled={disabled}
        options={[{ value: "", label: "Aucune source" }, ...sources.map((source) => ({ value: source.id, label: source.name }))]}
        onChange={(value) => onChange({ sourceIds: value ? [value] : [] })}
      />
      <InlineBadgeSelect
        label="Format"
        color={selectedFormat?.color ?? "default"}
        value={item.formats[0] ?? ""}
        disabled={disabled}
        options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((option) => ({ value: option.name, label: option.name }))]}
        onChange={(value) => onChange({ formats: value ? [value] : [] })}
      />
    </>
  );
}

function InputList({
  data,
  inputs,
  brands,
  sources,
  statusOptions,
  formatOptions,
  inlineSaving,
  onInlineChange,
  pendingAction,
  onOpen,
  onReject,
  onValidate
}: {
  data: BootstrapData;
  brand: Brand;
  inputs: InputContent[];
  brands: Brand[];
  sources: Source[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  inlineSaving: string;
  onInlineChange: (item: InputContent, patch: Partial<Pick<InputContent, "brandIds" | "sourceIds" | "formats" | "status">>) => Promise<void>;
  pendingAction: string;
  onOpen: (input: InputContent) => void;
  onReject: (inputId: string) => Promise<void>;
  onValidate: (inputId: string) => Promise<void>;
}) {
  if (inputs.length === 0) return <EmptyState label="Aucune inspiration a produire pour ce compte." />;

  return (
    <div className="space-y-3">
      {inputs.map((input) => (
        <WorkCard
          key={input.id}
          item={inputToCard(input, inputBrandName(data, input), firstNameFor(data, input.sourceIds))}
          hideNotionLink
          onOpen={() => onOpen(input)}
          badges={
            <InputCardBadges
              item={input}
              data={data}
              brands={brands}
              sources={sources}
              statusOptions={statusOptions}
              formatOptions={formatOptions}
              disabled={inlineSaving === input.id}
              onChange={(patch) => void onInlineChange(input, patch)}
            />
          }
          actions={
            <>
              <Button variant="light" disabled={pendingAction !== ""} onClick={() => void onReject(input.id)}>
                {pendingAction === `reject:${input.id}` ? "Rejet..." : "Rejeter"}
              </Button>
              <Button disabled={pendingAction !== ""} onClick={() => void onValidate(input.id)}>
                {pendingAction === `validate:${input.id}` ? "Production..." : "Produire"}
              </Button>
            </>
          }
        />
      ))}
    </div>
  );
}

function InputPopup({
  item,
  brands,
  sources,
  defaultBrandId,
  formatOptions,
  statusOptions,
  onSave,
  onClose
}: {
  item: InputContent;
  brands: Brand[];
  sources: Source[];
  defaultBrandId: string;
  formatOptions: NotionOption[];
  statusOptions: NotionOption[];
  onSave: (payload: {
    pageId: string;
    title: string;
    details: string;
    brandIds: string[];
    sourceIds: string[];
    formats: string[];
    status?: string;
  }) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [details, setDetails] = useState(item.details);
  const initialBrandId = item.brandIds[0] ?? defaultBrandId;
  const [brandId, setBrandId] = useState(initialBrandId);
  const [sourceId, setSourceId] = useState(item.sourceIds[0] ?? "");
  const [formats, setFormats] = useState(item.formats);
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty =
    title !== item.title ||
    details !== item.details ||
    brandId !== initialBrandId ||
    sourceId !== (item.sourceIds[0] ?? "") ||
    status !== item.status ||
    formats.join("|") !== item.formats.join("|");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await onSave({
        pageId: item.id,
        title,
        details,
        brandIds: brandId ? [brandId] : [],
        sourceIds: sourceId ? [sourceId] : [],
        formats,
        status
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Modification impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={item.title || "Inspiration"} onClose={onClose} shouldConfirmClose={isDirty && !saving}>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <BadgeSelect
            color="blue"
            value={brandId}
            onChange={setBrandId}
            options={[{ value: "", label: "Aucun compte" }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
          />
          <BadgeSelect
            color="purple"
            value={sourceId}
            onChange={setSourceId}
            options={[{ value: "", label: "Aucune source" }, ...sources.map((source) => ({ value: source.id, label: source.name }))]}
          />
          <BadgeSelect
            color={statusOptions.find((option) => option.name === status)?.color ?? "gray"}
            value={status}
            onChange={setStatus}
            options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
          />
          <BadgeSelect
            color={formatOptions.find((option) => option.name === formats[0])?.color ?? "gray"}
            value={formats[0] ?? ""}
            onChange={(value) => setFormats(value ? [value] : [])}
            options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((format) => ({ value: format.name, label: format.name }))]}
          />
        </div>

        <label className="block rounded-2xl bg-zinc-50 p-4">
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Titre</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mb-4 w-full bg-transparent text-base font-black text-zinc-950 outline-none"
            required
          />
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Details</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            className="w-full resize-y bg-transparent text-sm leading-6 text-zinc-700 outline-none"
            placeholder="Details ou angle de l'inspiration"
          />
        </label>

        {item.script ? <ReadBlock title="Script" value={item.script} /> : null}
        {item.caption ? <ReadBlock title="Legende" value={item.caption} /> : null}
        {item.externalUrl ? (
          <a className="inline-flex rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs font-black text-zinc-700 hover:bg-zinc-50" href={item.externalUrl} target="_blank" rel="noreferrer">
            Ouvrir le lien source
          </a>
        ) : null}

        {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="light" disabled={saving} onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ContentPopup({
  item,
  data,
  brands,
  statusOptions,
  formatOptions,
  onSave,
  onClose
}: {
  item: ContentItem;
  data: BootstrapData;
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
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
  onClose: () => void;
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
  const priority = getContentPriority(item, data);
  const phase = getProductionPhase(item);
  const isDirty =
    title !== item.title ||
    status !== item.status ||
    brandId !== (item.brandIds[0] ?? "") ||
    format !== item.format ||
    script !== item.script ||
    description !== item.description ||
    canvaUrl !== item.canvaUrl ||
    externalUrl !== item.externalUrl;

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
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sauvegarde impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={item.title || "Contenu"} onClose={onClose} shouldConfirmClose={isDirty && !saving}>
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <ProductionPhaseBadge phase={phase} />
          <PriorityBadge priority={priority} />
          <BadgeSelect
            color="blue"
            value={brandId}
            onChange={setBrandId}
            options={[{ value: "", label: "Aucun compte" }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
          />
          <BadgeSelect
            color={statusOptions.find((option) => option.name === status)?.color ?? "gray"}
            value={status}
            onChange={setStatus}
            options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
          />
          <BadgeSelect
            color={formatOptions.find((option) => option.name === format)?.color ?? "green"}
            value={format}
            onChange={setFormat}
            options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((option) => ({ value: option.name, label: option.name }))]}
          />
        </div>

        <AlertList alerts={priority.alerts} compact />

        <div className="rounded-3xl bg-zinc-50 p-4">
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
        </div>

        <div className="rounded-3xl bg-zinc-50 p-4">
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
        </div>

        {error ? <p className="text-sm font-black text-rose-600">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="light" disabled={saving} onClick={onClose}>
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
  color,
  value,
  options,
  onChange
}: {
  color: NotionOption["color"];
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const colors: Record<NotionOption["color"], string> = {
    default: "bg-zinc-100 text-zinc-700",
    gray: "bg-zinc-100 text-zinc-700",
    brown: "bg-stone-100 text-stone-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
    pink: "bg-pink-100 text-pink-700",
    red: "bg-rose-100 text-rose-700"
  };

  return (
    <label className={`rounded-full px-3 py-1 ${colors[color]}`}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-auto max-w-[180px] cursor-pointer appearance-none bg-transparent pr-1 text-xs font-black outline-none"
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

function ReadBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="mb-2 text-xs font-black uppercase text-zinc-400">{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{value}</p>
    </div>
  );
}

function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return <EmptyState label="Aucune source reliee." />;

  return (
    <div className="grid gap-3 xl:grid-cols-2">
      {sources.map((source) => (
        <div key={source.id} className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap gap-2">
            {source.tags.map((tag) => (
              <Badge key={tag} color="purple">{tag}</Badge>
            ))}
            {source.inputIds.length ? <Badge color="blue">{source.inputIds.length} inspirations</Badge> : null}
          </div>
          <h3 className="truncate text-base font-black text-zinc-950">{source.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{source.details || "Details non renseignes."}</p>
          <a className="mt-3 inline-flex text-xs font-black text-blue-700 hover:underline" href={source.url} target="_blank" rel="noreferrer">
            Ouvrir dans Notion
          </a>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-black text-zinc-950">{title}</h2>
      {count !== undefined ? <Badge>{count}</Badge> : null}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="text-xs font-black text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-zinc-950">{value}</p>
    </div>
  );
}
