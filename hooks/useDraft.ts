"use client";

import { useEffect, useCallback, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';

export function useDraft<T extends Record<string, any>>(key: string, form: UseFormReturn<T>) {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const isRestoredRef = useRef(false);

  // Restore draft on mount
  useEffect(() => {
    if (isRestoredRef.current) return;
    try {
      const saved = localStorage.getItem(`draft_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((field) => {
          form.setValue(field as any, parsed[field]);
        });
        isRestoredRef.current = true;
        return;
      }
    } catch {
      // ignore
    }
    isRestoredRef.current = true;
  }, [key, form]);

  // Watch and save
  useEffect(() => {
    const subscription = form.watch((values) => {
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
