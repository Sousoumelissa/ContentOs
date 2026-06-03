"use client";

import { Badge } from "@/components/Badge";
import { DataState } from "@/components/DataState";
import { NotionWarnings } from "@/components/NotionWarnings";
import { PageTitle } from "@/components/PageTitle";
import { useBootstrap } from "@/lib/use-bootstrap";

// Page Réglages : elle aide à vérifier la connexion et les options dynamiques.
// Elle ne montre jamais NOTION_TOKEN pour eviter de fuiter un secret.
export default function SettingsPage() {
  const { data, error, loading, reload } = useBootstrap();

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const rows = [
    { label: "[Brands]", count: data.brands.length, statuses: data.schemas.status.brands ?? [] },
    { label: "[Competitors]", count: data.sources.length, statuses: data.schemas.status.sources ?? [] },
    { label: "[Input Content]", count: data.inputs.length, statuses: data.schemas.status.inputs ?? [] },
    { label: "[Content hub]", count: data.contents.length, statuses: data.schemas.status.contents ?? [] },
    { label: "[Platforms]", count: data.platforms.length, statuses: data.schemas.status.platforms ?? [] }
  ];

  return (
    <section className="space-y-5">
      <PageTitle title="Réglages" description="Contrôle rapide des bases et statuts chargés depuis Notion." />
      <NotionWarnings warnings={data.warnings} />
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-950">{row.label}</h3>
                <p className="text-sm font-semibold text-zinc-500">{row.count} pages chargees</p>
              </div>
              <div className="flex max-w-3xl flex-wrap gap-2">
                {row.statuses.length === 0 ? <Badge>Aucun statut</Badge> : null}
                {row.statuses.map((status) => (
                  <Badge key={status.id} color={status.color}>
                    {status.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white p-5 text-sm text-zinc-600 shadow-sm">
        Derniere lecture Notion : <span className="font-black text-zinc-950">{new Date(data.updatedAt).toLocaleString("fr-FR")}</span>
      </div>
    </section>
  );
}
