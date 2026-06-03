"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotionOption } from "./notion/types";

export const allStatusOptionId = "__all_status_option__";

// Ce hook garde l'ordre des petits onglets dans le navigateur.
// Pour revenir a l'ordre Notion, utiliser le bouton "Reset" dans l'interface.
export function useOptionOrder(storageKey: string, options: NotionOption[]) {
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
  const [hiddenOptionIds, setHiddenOptionIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setSavedOrder(raw ? JSON.parse(raw) : []);
      const hiddenRaw = window.localStorage.getItem(`${storageKey}-hidden`);
      setHiddenOptionIds(hiddenRaw ? JSON.parse(hiddenRaw) : []);
    } catch {
      setSavedOrder([]);
      setHiddenOptionIds([]);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey]);

  const orderedOptions = useMemo(() => {
    if (savedOrder.length === 0) return options;

    const byId = new Map(options.map((option) => [option.id, option]));
    const ordered = savedOrder.map((id) => byId.get(id)).filter(Boolean) as NotionOption[];
    const newOptions = options.filter((option) => !savedOrder.includes(option.id));

    return [...ordered, ...newOptions];
  }, [options, savedOrder]);

  const filterOrderIds = useMemo(() => {
    if (savedOrder.length === 0) {
      return [allStatusOptionId, ...options.map((option) => option.id)];
    }

    const validOptionIds = new Set(options.map((option) => option.id));
    const cleanedOrder = savedOrder.filter((id, index) => {
      const isAllButton = id === allStatusOptionId && savedOrder.indexOf(id) === index;
      return isAllButton || validOptionIds.has(id);
    });
    const orderWithAll = cleanedOrder.includes(allStatusOptionId) ? cleanedOrder : [allStatusOptionId, ...cleanedOrder];
    const missingOptionIds = options.map((option) => option.id).filter((id) => !orderWithAll.includes(id));

    return [...orderWithAll, ...missingOptionIds];
  }, [options, savedOrder]);

  const visibleOptions = useMemo(() => {
    return orderedOptions.filter((option) => !hiddenOptionIds.includes(option.id));
  }, [hiddenOptionIds, orderedOptions]);

  const hiddenOptions = useMemo(() => {
    return orderedOptions.filter((option) => hiddenOptionIds.includes(option.id));
  }, [hiddenOptionIds, orderedOptions]);

  function save(nextOrder: string[]) {
    setSavedOrder(nextOrder);
    window.localStorage.setItem(storageKey, JSON.stringify(nextOrder));
  }

  function saveHidden(nextHiddenOptionIds: string[]) {
    setHiddenOptionIds(nextHiddenOptionIds);
    window.localStorage.setItem(`${storageKey}-hidden`, JSON.stringify(nextHiddenOptionIds));
  }

  function moveOption(optionId: string, direction: "left" | "right") {
    const ids = filterOrderIds;
    const index = ids.indexOf(optionId);
    const nextIndex = direction === "left" ? index - 1 : index + 1;

    if (index < 0 || nextIndex < 0 || nextIndex >= ids.length) return;

    const next = [...ids];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    save(next);
  }

  function resetOrder() {
    setSavedOrder([]);
    window.localStorage.removeItem(storageKey);
  }

  function toggleOptionVisibility(optionId: string) {
    const next = hiddenOptionIds.includes(optionId)
      ? hiddenOptionIds.filter((id) => id !== optionId)
      : [...hiddenOptionIds, optionId];

    saveHidden(next);
  }

  function resetHiddenOptions() {
    setHiddenOptionIds([]);
    window.localStorage.removeItem(`${storageKey}-hidden`);
  }

  return {
    orderedOptions,
    visibleOptions,
    hiddenOptions,
    hiddenOptionIds,
    filterOrderIds,
    isHydrated,
    moveOption,
    resetOrder,
    toggleOptionVisibility,
    resetHiddenOptions
  };
}
