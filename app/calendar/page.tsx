"use client";

import { DataState } from "@/components/DataState";
import { EmptyState } from "@/components/EmptyState";
import { PageTitle } from "@/components/PageTitle";
import { WorkCard, contentToCard } from "@/components/WorkCard";
import { useBootstrap } from "@/lib/use-bootstrap";
import { firstNameFor } from "@/lib/ui-helpers";

// Page Calendrier : elle utilise le champ Date de [Content hub].
// Si une date est vide dans Notion, le contenu reste dans la section "Sans date".
export default function CalendarPage() {
  const { data, error, loading, reload } = useBootstrap();

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const dated = data.contents.filter((item) => item.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = data.contents.filter((item) => !item.date);

  return (
    <section className="space-y-5">
      <PageTitle title="Calendrier" description="Planning base sur la date Notion des contenus." />
      <div className="space-y-3">
        {dated.length === 0 ? <EmptyState label="Aucun contenu date." /> : null}
        {dated.map((item) => (
          <WorkCard
            key={item.id}
            item={contentToCard(item, firstNameFor(data, item.brandIds))}
            database="contents"
            statusOptions={data.schemas.status.contents ?? []}
            onReload={reload}
          />
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-black text-zinc-950">Sans date</h3>
        {undated.slice(0, 10).map((item) => (
          <WorkCard key={item.id} item={contentToCard(item, firstNameFor(data, item.brandIds))} />
        ))}
      </div>
    </section>
  );
}
