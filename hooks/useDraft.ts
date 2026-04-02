"use client";

import { useEffect, useCallback, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';

export function useDraft<T extends Record<string, any>>(key: string, form: UseFormReturn<T>) {
  "use no memo";
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const isRestoredRef = useRef(false);
  // Guard: don't auto-save until restore completes to prevent overwriting draft with empty data
  const canSaveRef = useRef(false);

  // Restore draft on mount — use reset() so useFieldArray picks up nested arrays
  useEffect(() => {
    if (isRestoredRef.current) return;
    isRestoredRef.current = true;
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // reset() properly reinitializes all form state including field arrays
        form.reset(parsed, { keepDefaultValues: false });
      }
    } catch {
      // ignore corrupt draft data
    }
    // Allow auto-save after a short delay to let reset() propagate
    setTimeout(() => {
      canSaveRef.current = true;
    }, 1000);
  }, [key, form]);

  // Watch and save — only after restore is complete
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (!canSaveRef.current) return;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(`draft_${key}`, JSON.stringify(values));
        } catch {
          // ignore
        }
      }, 500);
    });
    return () => subscription.unsubscribe();
  }, [key, form]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(`draft_${key}`);
  }, [key]);

  const hasDraft = useCallback(() => {
    return localStorage.getItem(`draft_${key}`) !== null;
  }, [key]);

  return { clearDraft, hasDraft };
}
