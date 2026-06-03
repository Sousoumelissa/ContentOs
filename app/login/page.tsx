"use client";

import { useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/Button";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Connexion impossible.");
      }

      window.location.href = searchParams.get("next") || "/";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white">
          <Lock size={20} />
        </div>
        <h1 className="text-2xl font-black text-zinc-950">Content OS</h1>
        <p className="mt-1 text-sm font-semibold text-zinc-500">Entre le mot de passe pour acceder a la plateforme.</p>

        <label className="mt-6 block">
          <span className="mb-2 block text-xs font-black uppercase text-zinc-400">Mot de passe</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoFocus
            className="h-12 w-full rounded-2xl border border-zinc-100 px-4 text-sm font-bold outline-none focus:border-zinc-300"
            required
          />
        </label>

        {error ? <p className="mt-3 text-sm font-black text-rose-600">{error}</p> : null}

        <Button className="mt-5 w-full" type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </main>
  );
}
