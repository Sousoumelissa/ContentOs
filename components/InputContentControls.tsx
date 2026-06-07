"use client";

import { type FormEvent, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "./Button";
import { InlineBadgeSelect } from "./InlineBadgeSelect";
import { Modal } from "./Modal";
import { inputBrandId } from "@/lib/ui-helpers";
import type { BootstrapData, Brand, InputContent, NotionOption, OptionColor, Source } from "@/lib/notion/types";

type InputPatch = Partial<Pick<InputContent, "brandIds" | "sourceIds" | "formats" | "status">>;

export function InputCardBadges({
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
  onChange: (patch: InputPatch) => void;
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

export function InputStatusBadge({
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

export function InputContentPopup({
  item,
  brands,
  sources,
  defaultBrandId = "",
  formatOptions,
  statusOptions,
  onSave,
  onGenerate,
  onClose
}: {
  item: InputContent;
  brands: Brand[];
  sources: Source[];
  defaultBrandId?: string;
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
  onGenerate?: (inputId: string) => Promise<string | void>;
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
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [automationMessage, setAutomationMessage] = useState("");
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

  async function generateScript() {
    if (!onGenerate) return;

    setGenerating(true);
    setError("");
    setAutomationMessage("");

    try {
      const message = await onGenerate(item.id);
      setAutomationMessage(message || "Automatisation lancee pour cette inspiration.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Automatisation impossible a lancer.");
    } finally {
      setGenerating(false);
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
            options={[{ value: "", label: "Aucun compte" }, ...brands.map((brand) => ({ value: brand.id, label: brand.name }))]}
          />
          <BadgeSelect
            color="purple"
            label="Source"
            value={sourceId}
            onChange={setSourceId}
            options={[{ value: "", label: "Aucune source" }, ...sources.map((source) => ({ value: source.id, label: source.name }))]}
          />
          <BadgeSelect
            color={statusOptions.find((option) => option.name === status)?.color ?? "gray"}
            label="Statut"
            value={status}
            onChange={setStatus}
            options={statusOptions.map((option) => ({ value: option.name, label: option.name }))}
          />
          <BadgeSelect
            color={formatOptions.find((option) => option.name === formats[0])?.color ?? "gray"}
            label="Format"
            value={formats[0] ?? ""}
            onChange={(value) => setFormats(value ? [value] : [])}
            options={[{ value: "", label: "Aucun format" }, ...formatOptions.map((format) => ({ value: format.name, label: format.name }))]}
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
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Details</span>
          <textarea
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={5}
            className="w-full resize-y bg-transparent text-sm leading-6 text-zinc-700 outline-none"
            placeholder="Details ou angle de l'inspiration"
          />
        </label>

        <ReadBlock title="Script" value={item.script} />
        <ReadBlock title="Legende" value={item.caption} />

        {error ? <p className="text-xs font-bold text-rose-600">{error}</p> : null}
        {automationMessage ? <p className="text-xs font-bold text-emerald-700">{automationMessage}</p> : null}
        <div className="flex flex-wrap justify-end gap-2">
          {onGenerate ? (
            <Button type="button" variant="light" disabled={saving || generating} onClick={() => void generateScript()}>
              <Play size={14} />
              {generating ? "Lancement..." : "Generer le script"}
            </Button>
          ) : null}
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

function BadgeSelect({
  color,
  label,
  value,
  options,
  onChange
}: {
  color: OptionColor | "zinc";
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const colors: Record<OptionColor | "zinc", string> = {
    default: "bg-zinc-100 text-zinc-700",
    gray: "bg-zinc-100 text-zinc-700",
    brown: "bg-stone-100 text-stone-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-amber-100 text-amber-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-violet-100 text-violet-700",
    pink: "bg-pink-100 text-pink-700",
    red: "bg-rose-100 text-rose-700",
    zinc: "bg-zinc-100 text-zinc-700"
  };

  return (
    <label className={`rounded-full px-3 py-1 ${colors[color]}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-auto max-w-[180px] cursor-pointer appearance-none bg-transparent pr-1 text-xs font-black outline-none"
        title={`Modifier ${label.toLowerCase()}`}
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

function PropertyLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-50 px-4 py-3">
      <p className="text-[11px] font-black uppercase text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-zinc-800">{value || "Vide"}</p>
    </div>
  );
}

function ReadBlock({ title, value }: { title: string; value: string }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <p className="mb-2 text-xs font-black uppercase text-zinc-400">{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700">{value}</p>
    </div>
  );
}
