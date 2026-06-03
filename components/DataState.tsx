import { RefreshCcw } from "lucide-react";
import { Button } from "./Button";

export function DataState({
  loading,
  error,
  onRetry
}: {
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading) {
    return <div className="rounded-3xl bg-white p-5 text-sm font-bold text-zinc-500 shadow-sm">Chargement des donnees Notion...</div>;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-rose-700">Connexion Notion impossible</p>
        <p className="mt-1 text-sm text-zinc-600">{error}</p>
        <Button onClick={onRetry} className="mt-4">
          <RefreshCcw size={15} />
          Reessayer
        </Button>
      </div>
    );
  }

  return null;
}
