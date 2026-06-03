export function EmptyState({ label = "Aucun element a afficher." }: { label?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-8 text-center text-sm font-bold text-zinc-400">
      {label}
    </div>
  );
}
