"use client";

import { Badge } from "@/components/Badge";
import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { useBootstrap } from "@/lib/use-bootstrap";
import { firstNameFor } from "@/lib/ui-helpers";

// Page Assets : v1 basee sur les champs Canva, fichiers et Scenes de [Content hub].
// Si tu ajoutes une vraie base Assets plus tard, le mapping sera a modifier dans lib/notion.
export default function AssetsPage() {
  const { data, error, loading, reload } = useBootstrap();

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const items = data.contents.filter((item) => item.hasFiles || item.canvaUrl || item.sceneIds.length > 0);

  return (
    <section className="space-y-5">
      <PageTitle title="Assets" description="Visuels, scenes et liens Canva relies aux contenus." />
      {items.length === 0 ? <EmptyState label="Aucun asset trouve dans Content hub." /> : null}
      <div className="grid gap-3 xl:grid-cols-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge color="blue">{firstNameFor(data, item.brandIds)}</Badge>
              <Badge color={item.statusColor}>{item.status}</Badge>
              {item.hasFiles ? <Badge color="green">Fichiers</Badge> : null}
              {item.sceneIds.length ? <Badge color="purple">{item.sceneIds.length} scenes</Badge> : null}
              {item.canvaUrl ? <Badge color="pink">Canva</Badge> : null}
            </div>
            <h3 className="truncate text-base font-black text-zinc-950">{item.title}</h3>
            {item.canvaUrl ? (
              <a className="mt-3 inline-block text-sm font-black text-blue-700 hover:underline" href={item.canvaUrl} target="_blank" rel="noreferrer">
                Ouvrir Canva
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
