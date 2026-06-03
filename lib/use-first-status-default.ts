"use client";

import { useEffect, useRef } from "react";
import type { NotionOption } from "./notion/types";

// Au premier chargement d'une page, selectionne le premier statut visible.
// Ensuite l'utilisateur peut cliquer sur "Tout" sans etre renvoye automatiquement.
export function useFirstStatusDefault({
  status,
  setStatus,
  visibleOptions,
  isReady
}: {
  status: string;
  setStatus: (value: string) => void;
  visibleOptions: NotionOption[];
  isReady: boolean;
}) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current || !isReady) return;
    if (visibleOptions.length === 0) return;

    const firstVisibleStatus = visibleOptions[0]?.name;
    if (firstVisibleStatus && status === "Tout") {
      setStatus(firstVisibleStatus);
    }

    hasInitialized.current = true;
  }, [isReady, setStatus, status, visibleOptions]);
}
