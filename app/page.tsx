"use client";

import { BarChart3, CheckCircle2, Clapperboard, Lightbulb, Users } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { DataState } from "@/components/DataState";
import { NotionWarnings } from "@/components/NotionWarnings";
import { PageTitle } from "@/components/PageTitle";
import { Surface } from "@/components/Surface";
import { WorkCard, contentToCard, inputToCard } from "@/components/WorkCard";
import { useBootstrap } from "@/lib/use-bootstrap";
import { firstNameFor, inputBrandName, isReady } from "@/lib/ui-helpers";

// Page Dashboard : elle resume tout ce qui vient de Notion.
// Pour changer les chiffres visibles, modifier le tableau "stats" ci-dessous.
export default function DashboardPage() {
  const { data, error, loading, reload } = useBootstrap();

  if (!data) return <DataState loading={loading} error={error} onRetry={reload} />;

  const stats = [
    { label: "Comptes", value: data.brands.length, icon: Users },
    { label: "Inspirations", value: data.inputs.length, icon: Lightbulb },
    { label: "En production", value: data.contents.filter((item) => !isReady(item)).length, icon: Clapperboard },
    { label: "Prets", value: data.contents.filter(isReady).length, icon: CheckCircle2 }
  ];

  const focusInputs = data.inputs.slice(0, 2).map((item) =>
    inputToCard(item, inputBrandName(data, item), firstNameFor(data, item.sourceIds))
  );
  const focusContents = data.contents.slice(0, 3).map((item) => contentToCard(item, firstNameFor(data, item.brandIds)));

  return (
    <section className="space-y-5">
      <PageTitle title="Dashboard" description="Vue rapide de tes bases Notion." />
      <NotionWarnings warnings={data.warnings} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="rounded-2xl sm:rounded-3xl">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-50 text-violet-600 sm:h-10 sm:w-10">
              <Icon size={18} />
            </div>
            <p className="text-xs font-bold text-zinc-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-zinc-950 sm:text-3xl">{value}</p>
          </Card>
        ))}
      </div>

      <Surface className="p-3 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-zinc-950">Focus</h3>
            <p className="text-xs font-medium text-zinc-400">Les derniers elements charges depuis Notion.</p>
          </div>
          <Badge>{focusInputs.length + focusContents.length} actions</Badge>
        </div>

        <div className="grid min-w-0 gap-3 xl:grid-cols-2">
          {[...focusInputs, ...focusContents].map((item) => (
            <WorkCard key={item.id} item={item} />
          ))}
        </div>
      </Surface>
    </section>
  );
}
