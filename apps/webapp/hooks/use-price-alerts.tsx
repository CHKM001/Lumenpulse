"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { PriceAlertApiService, PriceAlertRule } from '@/lib/price-alert-service';

interface PriceAlertsState {
  rules: PriceAlertRule[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRule: (payload: { symbol: string; targetPrice: number; condition: string; cooldownMinutes?: number; channel?: string }) => Promise<PriceAlertRule>;
  updateRule: (id: string, payload: Partial<PriceAlertRule>) => Promise<PriceAlertRule>;
  removeRule: (id: string) => Promise<void>;
}

const PriceAlertsContext = createContext<PriceAlertsState>({
  rules: [],
  isLoading: false,
  isSyncing: false,
  error: null,
  refresh: async () => {},
  createRule: async () => ({} as PriceAlertRule),
  updateRule: async () => ({} as PriceAlertRule),
  removeRule: async () => {},
});

export function usePriceAlerts() {
  return useContext(PriceAlertsContext);
}

export function PriceAlertsProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<PriceAlertRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await PriceAlertApiService.list();
      setRules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price alerts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createRule = useCallback(async (payload: { symbol: string; targetPrice: number; condition: string; cooldownMinutes?: number; channel?: string }) => {
    const optimisticId = `temp-${Date.now()}`;
    const temp: PriceAlertRule = {
      id: optimisticId,
      userId: 'me',
      symbol: payload.symbol.toUpperCase(),
      targetPrice: payload.targetPrice,
      condition: payload.condition as any,
      isActive: true,
      cooldownMinutes: payload.cooldownMinutes ?? 60,
      lastTriggeredAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRules((r) => [temp, ...r]);
    setIsSyncing(true);

    try {
      const created = await PriceAlertApiService.create({ symbol: payload.symbol, targetPrice: payload.targetPrice, condition: payload.condition as any, cooldownMinutes: payload.cooldownMinutes });
      setRules((r) => r.map(x => x.id === optimisticId ? created : x));
      return created;
    } catch (err) {
      setRules((r) => r.filter(x => x.id !== optimisticId));
      setError(err instanceof Error ? err.message : 'Failed to create rule');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const updateRule = useCallback(async (id: string, payload: Partial<PriceAlertRule>) => {
    const prev = [...rules];
    setRules((r) => r.map(x => x.id === id ? { ...x, ...payload } : x));
    setIsSyncing(true);
    try {
      const updated = await PriceAlertApiService.update(id, payload as any);
      setRules((r) => r.map(x => x.id === id ? updated : x));
      return updated;
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : 'Failed to update rule');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [rules]);

  const removeRule = useCallback(async (id: string) => {
    const prev = [...rules];
    setRules((r) => r.filter(x => x.id !== id));
    setIsSyncing(true);
    try {
      await PriceAlertApiService.remove(id);
    } catch (err) {
      setRules(prev);
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [rules]);

  return (
    <PriceAlertsContext.Provider value={{ rules, isLoading, isSyncing, error, refresh, createRule, updateRule, removeRule }}>
      {children}
    </PriceAlertsContext.Provider>
  );
}
