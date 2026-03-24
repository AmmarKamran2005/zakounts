"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ZakatRecord } from '@/types';

export function useZakat(filters?: { year?: number; minAmount?: number; maxAmount?: number }) {
  const [records, setRecords] = useState<ZakatRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters?.year) params.set('year', String(filters.year));
      if (filters?.minAmount !== undefined) params.set('minAmount', String(filters.minAmount));
      if (filters?.maxAmount !== undefined) params.set('maxAmount', String(filters.maxAmount));
      const { data } = await api.get(`/zakat?${params.toString()}`);
      setRecords(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, [filters?.year, filters?.minAmount, filters?.maxAmount]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const createRecord = async (formData: any) => {
    const { data } = await api.post('/zakat', formData);
    await fetchRecords();
    return data.data;
  };

  const updateRecord = async (id: string, formData: any) => {
    const { data } = await api.put(`/zakat/${id}`, formData);
    await fetchRecords();
    return data.data;
  };

  const deleteRecord = async (id: string) => {
    await api.delete(`/zakat/${id}`);
    await fetchRecords();
  };

  return { records, loading, error, createRecord, updateRecord, deleteRecord, refetch: fetchRecords };
}

export function useZakatRecord(id: string) {
  const [record, setRecord] = useState<ZakatRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true);
        const { data } = await api.get(`/zakat/${id}`);
        setRecord(data.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch record');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetch();
  }, [id]);

  return { record, loading, error };
}
