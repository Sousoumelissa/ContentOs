"use client";

import { Badge } from "./Badge";
import { InlineBadgeSelect } from "./InlineBadgeSelect";
import { AlertList, PriorityBadge, ProductionPhaseBadge } from "./ProductionInsights";
import { WorkCard, contentToCard } from "./WorkCard";
import type { BootstrapData, Brand, ContentItem, NotionOption } from "@/lib/notion/types";
import { getContentPriority, getProductionPhase } from "@/lib/production-insights";
import { firstNameFor } from "@/lib/ui-helpers";

type ContentPatch = Partial<Pick<ContentItem, "status" | "format" | "brandIds">>;

// Carte Production partagee entre /production et /accounts/[brandId].
// Les pages lui donnent les donnees et les actions, mais la carte gere l'affichage stable.
export function ContentCard({
  item,
  data,
  brands,
  statusOptions,
  formatOptions,
  disabled,
  onChange,
  onOpen
}: {
  item: ContentItem;
  data: BootstrapData;
  brands: Brand[];
  statusOptions: NotionOption[];
  formatOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: ContentPatch) => void;
  onOpen: (item: ContentItem) => void;
}) {
  return (
    <WorkCard
      item={contentToCard(item, firstNameFor(data, item.brandIds))}
      hideNotionLink
      onOpen={() => onOpen(item)}
      badges={
        <ContentCardBadges
          item={item}
          brands={brands}
          formatOptions={formatOptions}
          disabled={disabled}
          onChange={onChange}
        />
      }
      statusBadge={
        <ContentStatusBadge
          item={item}
          statusOptions={statusOptions}
          disabled={disabled}
          onChange={onChange}
        />
      }
      footer={<AlertList alerts={getContentPriority(item, data).alerts} compact />}
    />
  );
}

export function ContentCardBadges({
  item,
  brands,
  formatOptions,
  disabled,
  onChange
}: {
  item: ContentItem;
  brands: Brand[];
  formatOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: ContentPatch) => void;
}) {
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

export function ContentStatusBadge({
  item,
  statusOptions,
  disabled,
  onChange
}: {
  item: ContentItem;
  statusOptions: NotionOption[];
  disabled: boolean;
  onChange: (patch: Partial<Pick<ContentItem, "status">>) => void;
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
