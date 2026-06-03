"use client";

import { Badge } from "@/components/Badge";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { useBootstrap } from "@/lib/use-bootstrap";
import { firstNameFor, isPublished, normalize } from "@/lib/ui-helpers";

// Page Performances : v1 sans analytics externe.
// Elle classe les contenus publies/abandonnes depuis le statut Notion.
export default function PerformancesPage() {
  const { data, error, loading, reload } = useBootstrap();

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const items = data.contents.filter((item) => isPublished(item) || normalize(item.status).includes("abandon"));

  return (
    <section className="space-y-5">
      <PageTitle title="Performances" description="Lecture v1 des contenus publies et abandonnes." />
      {items.length === 0 ? <EmptyState label="Aucun contenu publie ou abandonne trouve." /> : null}
      <div className="grid gap-3 xl:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge color="blue">{firstNameFor(data, item.brandIds)}</Badge>
              <Badge color={item.statusColor}>{item.status}</Badge>
              {item.format ? <Badge>{item.format}</Badge> : null}
            </div>
            <h3 className="line-clamp-2 text-base font-black text-zinc-950">{item.title}</h3>
            <p className="mt-3 text-xs font-bold text-zinc-400">Ajoute des champs vues/likes dans Notion pour enrichir cette page.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
