"use client";

import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/Button";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { InlineBadgeSelect } from "@/components/InlineBadgeSelect";
import { Modal } from "@/components/Modal";
import { PageTitle } from "@/components/PageTitle";
import { Tabs } from "@/components/Tabs";
import { WorkCard, inputToCard } from "@/components/WorkCard";
import { patchInput, postContentFromInput, postInput, patchStatus, postProductionAutomation } from "@/lib/api";
import { getInputStatusCorrection, inputStatusCorrectionMessage } from "@/lib/input-readiness";
import { useBootstrap } from "@/lib/use-bootstrap";
import { useFirstStatusDefault } from "@/lib/use-first-status-default";
import { useOptionOrder } from "@/lib/use-option-order";
import { firstNameFor, includesQuery, inputBrandId, inputBrandName } from "@/lib/ui-helpers";
import type { BootstrapData, Brand, InputContent, NotionOption, Source } from "@/lib/notion/types";
import { makeStatusCounts } from "@/lib/status-counts";

// Page Idées/Inspi : elle combine [Input Content] et [Competitors].
// Le petit formulaire cree une vraie page dans Notion.
export default function IdeasPage() {
  const { data, error, loading, reload } = useBootstrap();
  const [tab, setTab] = useState("inputs");
  const [query, setQuery] = useState("");
  const [account, setAccount] = useState("Tous les comptes");
  const [status, setStatus] = useState("Tout");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [openedInput, setOpenedInput] = useState<InputContent | null>(null);
  const [pendingAction, setPendingAction] = useState("");
  const [inlineSaving, setInlineSaving] = useState("");
  const [launchingAutomation, setLaunchingAutomation] = useState(false);
  const [correctingStatuses, setCorrectingStatuses] = useState(false);
  const statusOrder = useOptionOrder("content-os-status-order-inputs", data?.schemas.status.inputs ?? []);
  useFirstStatusDefault({ status, setStatus, visibleOptions: statusOrder.visibleOptions, isReady: statusOrder.isHydrated });
  const hiddenInputStatusNames = useMemo(() => new Set(statusOrder.hiddenOptions.map((option) => option.name)), [statusOrder.hiddenOptions]);

  const accountOptions = data?.brands.map((brand) => brand.name) ?? [];

  const inputsForStatusCounts = useMemo(() => {
    if (!data) return [];
    const selectedBrand = data.brands.find((brand) => brand.name === account);

    return data.inputs.filter((item) => {
      const matchQuery = includesQuery([item.title, item.details, item.script, item.status], query);
      const matchAccount = account === "Tous les comptes" || item.brandIds.includes(selectedBrand?.id ?? "");
      return matchQuery && matchAccount;
    });
  }, [account, data, query]);

  const inputStatusCounts = useMemo(
    () => makeStatusCounts(inputsForStatusCounts, (item) => item.status, hiddenInputStatusNames),
    [hiddenInputStatusNames, inputsForStatusCounts]
  );

  const filteredInputs = useMemo(() => {
    return inputsForStatusCounts.filter((item) => (status === "Tout" ? !hiddenInputStatusNames.has(item.status) : item.status === status));
  }, [hiddenInputStatusNames, inputsForStatusCounts, status]);

  const filteredSources = useMemo(() => {
    if (!data) return [];
    const selectedBrand = data.brands.find((brand) => brand.name === account);

    return data.sources.filter((source) => {
      const matchQuery = includesQuery([source.name, source.details, source.tags.join(" ")], query);
      const matchAccount = account === "Tous les comptes" || source.brandIds.includes(selectedBrand?.id ?? "");
      return matchQuery && matchAccount;
    });
  }, [account, data, query]);

  const validateInputs = useMemo(() => {
    if (!data) return [];

    return data.inputs.filter((item) => item.status === "Validate");
  }, [data]);

  const statusCorrections = useMemo(() => {
    if (!data) return [];

    return inputsForStatusCounts
      .map((input) => ({ input, correction: getInputStatusCorrection(data, input) }))
      .filter((item) => item.correction !== null);
  }, [data, inputsForStatusCounts]);

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  async function validateInput(inputId: string) {
    const currentData = data;
    if (!currentData) return;

    setMessage("");
    setPendingAction(`validate:${inputId}`);
    try {
      const input = currentData.inputs.find((item) => item.id === inputId);
      const correction = input ? getInputStatusCorrection(currentData, input) : null;

      if (correction) {
        await patchStatus("inputs", inputId, correction.targetStatus);
        setMessage(inputStatusCorrectionMessage(correction));
        await reload();
        return;
      }

      await postContentFromInput(inputId, "Validate");
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
      await reload();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Action impossible.");
    } finally {
      setPendingAction("");
    }
  }

  async function launchProductionAutomation() {
    if (validateInputs.length === 0) return;

    setMessage("");
    setLaunchingAutomation(true);

    try {
      const result = await postProductionAutomation({ inputIds: validateInputs.map((input) => input.id) });
      setMessage(result.message);
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
    setMessage("Inspiration mise à jour dans Notion.");
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

  return (
    <section className="space-y-5">
      <PageTitle title="Idées/Inspi" description="Inputs et sources connectés à Notion." action="Ajouter inspiration" onAction={() => setShowForm(true)} />

      {message ? <div className="rounded-3xl bg-white p-3 text-sm font-bold text-zinc-700 shadow-sm">{message}</div> : null}
      {showForm ? <NewInputForm onClose={() => setShowForm(false)} onDone={reload} brands={data.brands} /> : null}
      {openedInput ? (
        <InputPopup
          item={openedInput}
          brandName={firstNameFor(data, openedInput.brandIds)}
          sourceName={sourceNameFor(data, openedInput.sourceIds)}
          brands={data.brands}
          sources={data.sources}
          formatOptions={data.schemas.format.inputs ?? []}
          statusOptions={statusOrder.orderedOptions}
          onSave={saveInput}
          onClose={() => setOpenedInput(null)}
        />
      ) : null}

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <Tabs
          active={tab}
          setActive={setTab}
          items={[
            { key: "inputs", label: "Inputs", count: filteredInputs.length },
            { key: "sources", label: "Sources", count: filteredSources.length }
          ]}
        />
        <div className="mt-4">
          <FilterBar
            query={query}
            setQuery={setQuery}
            account={account}
            setAccount={setAccount}
            accountOptions={accountOptions}
            status={status}
            setStatus={tab === "inputs" ? setStatus : undefined}
            statuses={tab === "inputs" ? statusOrder.orderedOptions : []}
            statusCounts={tab === "inputs" ? inputStatusCounts : {}}
            statusOrderIds={statusOrder.filterOrderIds}
            canEditStatusOrder={tab === "inputs"}
            hiddenStatusIds={statusOrder.hiddenOptionIds}
            onMoveStatus={statusOrder.moveOption}
            onResetStatusOrder={statusOrder.resetOrder}
            onToggleStatusVisibility={statusOrder.toggleOptionVisibility}
            onResetStatusVisibility={statusOrder.resetHiddenOptions}
            actions={
              tab === "inputs" ? (
                <>
                  <Button variant="light" disabled={correctingStatuses} onClick={() => void applyStatusCorrections()}>
                    {correctingStatuses ? "Correction..." : "Verifier"}
                  </Button>
                  <Button variant="light" disabled={launchingAutomation || validateInputs.length === 0} onClick={() => void launchProductionAutomation()}>
                    <Play size={14} />
                    {launchingAutomation ? "Lancement..." : "Lancer scripts"}
                  </Button>
                </>
              ) : null
            }
          />
        </div>
      </div>

      {tab === "inputs" ? (
        <div className="space-y-3">
          {filteredInputs.length === 0 ? <EmptyState label="Aucune inspiration trouvee." /> : null}
          {filteredInputs.map((item) => (
            <WorkCard
              key={item.id}
              item={inputToCard(item, inputBrandName(data, item), sourceNameFor(data, item.sourceIds))}
              hideNotionLink
              onOpen={() => setOpenedInput(item)}
              badges={
                <InputCardBadges
                  item={item}
                  data={data}
                  brands={data.brands}
                  sources={data.sources}
                  formatOptions={data.schemas.format.inputs ?? []}
                  disabled={inlineSaving === item.id}
                  onChange={(patch) => void saveInputInline(item, patch)}
                />
              }
              statusBadge={
                <InputStatusBadge
                  item={item}
                  statusOptions={statusOrder.orderedOptions}
                  disabled={inlineSaving === item.id}
                  onChange={(patch) => void saveInputInline(item, patch)}
                />
              }
              actions={
                <>
                  <Button variant="light" disabled={pendingAction !== ""} onClick={() => void rejectInput(item.id)}>
                    {pendingAction === `reject:${item.id}` ? "Rejet..." : "Rejeter"}
                  </Button>
                  <Button disabled={pendingAction !== ""} onClick={() => void validateInput(item.id)}>
                    {pendingAction === `validate:${item.id}` ? "Validation..." : "Valider"}
                  </Button>
                </>
              }
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSources.length === 0 ? <EmptyState label="Aucune source trouvee." /> : null}
          {filteredSources.map((source) => (
            <div key={source.id} className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="truncate text-base font-black text-zinc-950">{source.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{source.details || "Details non renseignes"}</p>
              <p className="mt-3 text-xs font-bold text-zinc-400">{source.inputIds.length} inputs relies</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InputCardBadges({
  item,
  data,
  brands,
  sources,
  formatOptions,
  disabled,
  onChange
}: {
  item: InputContent;
  data: BootstrapData;
  brands: Brand[];
  sources: Source[];
  formatOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: Partial<Pick<InputContent, "brandIds" | "sourceIds" | "formats" | "status">>) => void;
}) {
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

function InputStatusBadge({
  item,
  statusOptions,
  disabled,
  onChange
}: {
  item: InputContent;
  statusOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: Partial<Pick<InputContent, "status">>) => void;
}) {
  const selectedStatus = statusOptions.find((option) => option.name === item.status);

  return (
    <InlineBadgeSelect
      label="Statut"
      color={selectedStatus?.color ?? item.statusColor}
      value={item.status}
      disabled={disabled}
      options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
      onChange={(value) => onChange({ status: value })}
    />
  );
}

function sourceNameFor(data: BootstrapData, sourceIds: string[]) {
  return sourceIds.length ? firstNameFor(data, sourceIds) : "";
}

function InputPopup({
  item,
  brandName,
  sourceName,
  brands,
  sources,
  formatOptions,
  statusOptions,
  onSave,
  onClose
}: {
  item: InputContent;
  brandName: string;
  sourceName: string;
  brands: Brand[];
  sources: Source[];
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
  const [brandId, setBrandId] = useState(item.brandIds[0] ?? "");
  const [sourceId, setSourceId] = useState(item.sourceIds[0] ?? "");
  const [formats, setFormats] = useState(item.formats);
  const [status, setStatus] = useState(item.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isDirty =
    title !== item.title ||
    details !== item.details ||
    brandId !== (item.brandIds[0] ?? "") ||
    sourceId !== (item.sourceIds[0] ?? "") ||
    status !== item.status ||
    formats.join("|") !== item.formats.join("|");

  // Evite de perdre des modifications en fermant la popup par erreur.
  function requestClose() {
    if (isDirty && !saving && !window.confirm("Des modifications ne sont pas sauvegardees. Fermer quand meme ?")) return;
    onClose();
  }

  async function submit(event: React.FormEvent) {
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
            label="Compte"
            value={brandId}
            onChange={setBrandId}
            options={[{ id: "", name: "Aucun compte" }, ...brands.map((brand) => ({ id: brand.id, name: brand.name }))]}
          />
          <BadgeSelect
            color="purple"
            label="Source"
            value={sourceId}
            onChange={setSourceId}
            options={[{ id: "", name: "Aucune source" }, ...sources.map((source) => ({ id: source.id, name: source.name }))]}
          />
          <BadgeSelect
            color={statusOptions.find((option) => option.name === status)?.color ?? "zinc"}
            label="État"
            value={status}
            onChange={setStatus}
            options={statusOptions.map((option) => ({ id: option.name, name: option.name }))}
          />
          <BadgeSelect
            color={formatOptions.find((option) => option.name === formats[0])?.color ?? "zinc"}
            label="Format"
            value={formats[0] ?? ""}
            onChange={(value) => setFormats(value ? [value] : [])}
            options={[{ id: "", name: "Aucun format" }, ...formatOptions.map((format) => ({ id: format.name, name: format.name }))]}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <PropertyLine label="ID page" value={item.id} />
        </div>

        <div className="flex flex-wrap gap-2">
          <a className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-black text-white hover:bg-zinc-800" href={item.url} target="_blank" rel="noreferrer">
            Ouvrir dans Notion
          </a>
          {item.externalUrl ? (
            <a className="rounded-xl border border-zinc-100 bg-white px-3 py-2 text-xs font-black text-zinc-700 hover:bg-zinc-50" href={item.externalUrl} target="_blank" rel="noreferrer">
              Ouvrir le lien source
            </a>
          ) : null}
        </div>

        <label className="block rounded-2xl bg-zinc-50 p-4">
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Titre</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mb-4 w-full bg-transparent text-base font-black text-zinc-950 outline-none"
            required
          />
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Détails</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            className="w-full resize-y bg-transparent text-sm leading-6 text-zinc-700 outline-none"
            placeholder="Détails ou angle de l'inspiration"
          />
        </label>
        <PopupBlock title="Script" value={item.script} />
        <PopupBlock title="Légende" value={item.caption} />

        {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="light" disabled={saving} onClick={requestClose}>
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

function PropertyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-zinc-800">{value || "Vide"}</p>
    </div>
  );
}

function BadgeSelect({
  color,
  label,
  value,
  onChange,
  options
}: {
  color: "blue" | "purple" | "zinc" | "default" | "gray" | "brown" | "orange" | "yellow" | "green" | "pink" | "red";
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
}) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
    zinc: "bg-zinc-100 text-zinc-700",
    default: "bg-zinc-100 text-zinc-700",
    gray: "bg-zinc-100 text-zinc-700",
    brown: "bg-stone-100 text-stone-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    pink: "bg-pink-100 text-pink-700",
    red: "bg-rose-100 text-rose-700"
  };

  return (
    <label className={`rounded-full px-3 py-1 ${colors[color]}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-auto max-w-[170px] cursor-pointer appearance-none bg-transparent pr-1 text-xs font-black outline-none"
        title={`Modifier ${label.toLowerCase()}`}
      >
        {options.map((option) => (
          <option key={option.id || "empty"} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function PopupBlock({ title, value }: { title: string; value: string }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="mb-2 text-xs font-black uppercase text-zinc-400">{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{value}</p>
    </div>
  );
}

function NewInputForm({
  brands,
  onClose,
  onDone
}: {
  brands: { id: string; name: string }[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [brandId, setBrandId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await postInput({
        title,
        details,
        brandIds: brandId ? [brandId] : []
      });
      onClose();
      await onDone();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Creation impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Titre de l'inspiration"
          className="h-10 rounded-2xl border border-zinc-100 px-3 text-sm outline-none md:col-span-1"
          required
        />
        <input
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Details ou angle"
          className="h-10 rounded-2xl border border-zinc-100 px-3 text-sm outline-none md:col-span-1"
        />
        <select value={brandId} onChange={(event) => setBrandId(event.target.value)} className="h-10 rounded-2xl border border-zinc-100 px-3 text-sm outline-none">
          <option value="">Aucun compte</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="mt-2 text-xs font-bold text-rose-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={saving}>
          Creer dans Notion
        </Button>
        <Button type="button" variant="light" onClick={onClose}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
