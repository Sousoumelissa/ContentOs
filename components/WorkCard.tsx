import { ExternalLink } from "lucide-react";
import { Card, CardActions, CardBadges, CardFooter, CardTitle } from "./Card";
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
  statusBadge,
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
  statusBadge?: React.ReactNode;
  extraBadges?: React.ReactNode;
  footer?: React.ReactNode;
  hideNotionLink?: boolean;
  onOpen?: () => void;
}) {
  // Le statut reste toujours dans son coin a droite pour ne pas se melanger aux autres badges.
  const renderedStatusBadge =
    statusBadge ??
    (database && statusOptions && onReload ? (
      <StatusSelect database={database} pageId={item.id} value={item.status} options={statusOptions} onDone={onReload} />
    ) : (
      <Badge color={item.statusColor}>{item.status || "Sans statut"}</Badge>
    ));

  return (
    <Card
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
      interactive={Boolean(onOpen)}
    >
      <div className="flex w-full min-w-0 max-w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <CardBadges>
                {badges ?? (
                  <>
                    {item.brandName ? <Badge color="blue">{item.brandName}</Badge> : null}
                    {item.sourceName ? <Badge color="purple">{item.sourceName}</Badge> : null}
                    {item.format ? <Badge>{item.format}</Badge> : null}
                    {item.date ? <Badge color="green">{item.date}</Badge> : null}
                    {extraBadges}
                  </>
                )}
              </CardBadges>

              <CardTitle>{item.title || "Sans titre"}</CardTitle>
            </div>

            <div className="flex max-w-[42vw] shrink-0 justify-end md:max-w-[220px]" onClick={(event) => event.stopPropagation()}>
              {renderedStatusBadge}
            </div>
          </div>

          {item.details ? <p className="line-clamp-2 break-words text-sm text-zinc-600">{item.details}</p> : null}
          {footer ? <CardFooter>{footer}</CardFooter> : null}
        </div>

        <CardActions onClick={(event) => event.stopPropagation()}>
          {actions}
          {!hideNotionLink ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              <Button variant="light">
                <ExternalLink size={14} />
                Notion
              </Button>
            </a>
          ) : null}
        </CardActions>
      </div>
    </Card>
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
