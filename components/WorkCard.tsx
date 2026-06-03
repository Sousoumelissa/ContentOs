import { ExternalLink } from "lucide-react";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { StatusSelect } from "./StatusSelect";
import type { ContentItem, DatabaseKey, InputContent, NotionOption, OptionColor } from "@/lib/notion/types";

type CardItem = {
  id: string;
  url: string;
  title: string;
  status: string;
  statusColor: OptionColor;
  details?: string;
  brandName?: string;
  sourceName?: string;
  format?: string;
  date?: string;
};

export function WorkCard({
  item,
  database,
  statusOptions,
  onReload,
  actions,
  badges,
  extraBadges,
  footer,
  hideNotionLink = false,
  onOpen
}: {
  item: CardItem;
  database?: DatabaseKey;
  statusOptions?: NotionOption[];
  onReload?: () => void;
  actions?: React.ReactNode;
  badges?: React.ReactNode;
  extraBadges?: React.ReactNode;
  footer?: React.ReactNode;
  hideNotionLink?: boolean;
  onOpen?: () => void;
}) {
  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (!onOpen) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className={`rounded-3xl bg-white p-4 shadow-sm ${
        onOpen ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-zinc-950/20" : ""
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            {badges ?? (
              <>
                {item.brandName ? <Badge color="blue">{item.brandName}</Badge> : null}
                <Badge color={item.statusColor}>{item.status || "Sans statut"}</Badge>
                {item.sourceName ? <Badge color="purple">{item.sourceName}</Badge> : null}
                {item.format ? <Badge>{item.format}</Badge> : null}
                {item.date ? <Badge color="green">{item.date}</Badge> : null}
                {extraBadges}
              </>
            )}
          </div>

          <h3 className="truncate text-base font-black text-zinc-950">{item.title || "Sans titre"}</h3>
          {item.details ? <p className="line-clamp-2 text-sm text-zinc-600">{item.details}</p> : null}
          {footer ? <div className="pt-1">{footer}</div> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 md:flex-col" onClick={(event) => event.stopPropagation()}>
          {database && statusOptions && onReload ? (
            <StatusSelect database={database} pageId={item.id} value={item.status} options={statusOptions} onDone={onReload} />
          ) : null}
          {actions}
          {!hideNotionLink ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              <Button variant="light">
                <ExternalLink size={14} />
                Notion
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function inputToCard(item: InputContent, brandName: string, sourceName: string): CardItem {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    status: item.status,
    statusColor: item.statusColor,
    details: item.details || item.script,
    brandName,
    sourceName,
    format: item.formats.join(", ")
  };
}

export function contentToCard(item: ContentItem, brandName: string): CardItem {
  return {
    id: item.id,
    url: item.url,
    title: item.title,
    status: item.status,
    statusColor: item.statusColor,
    details: item.description || item.script,
    brandName,
    format: item.format,
    date: item.date
  };
}
