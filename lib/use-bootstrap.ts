"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBootstrap } from "./api";
import type { BootstrapData } from "./notion/types";

export function useBootstrap() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setData(await fetchBootstrap());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
