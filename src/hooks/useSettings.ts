"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Settings } from '@/types';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      setSettings(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (formData: any) => {
    const { data } = await api.put('/settings', formData);
    setSettings(data.data);
    return data.data;
  };

  const fetchRates = async () => {
    const { data } = await api.get('/rates/fetch');
    return data.data;
  };

  return { settings, loading, updateSettings, fetchRates, refetch: fetchSettings };
}
