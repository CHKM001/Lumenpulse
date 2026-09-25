import { clientConfig } from '@/lib/config';

export type PriceAlertCondition = 'above' | 'below';

export interface PriceAlertRule {
  id: string;
  userId: string;
  symbol: string;
  targetPrice: number;
  condition: PriceAlertCondition;
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PriceAlertApiService {
  private static readonly BASE_URL = clientConfig.apiUrl;

  private static getAuthHeaders(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    const match = document.cookie.split('; ').find((row) => row.startsWith('auth-token='));
    const token = match?.split('=')[1];
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  static async list(): Promise<PriceAlertRule[]> {
    const res = await fetch(`${this.BASE_URL}/price-alerts`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch price alerts');
    return res.json();
  }

  static async get(id: string): Promise<PriceAlertRule> {
    const res = await fetch(`${this.BASE_URL}/price-alerts/${id}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch price alert');
    return res.json();
  }

  static async create(payload: { symbol: string; targetPrice: number; condition: PriceAlertCondition; cooldownMinutes?: number; }) {
    const res = await fetch(`${this.BASE_URL}/price-alerts`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create price alert');
    }
    return res.json();
  }

  static async update(id: string, payload: Partial<{ targetPrice: number; condition: PriceAlertCondition; isActive: boolean; cooldownMinutes: number; }>) {
    const res = await fetch(`${this.BASE_URL}/price-alerts/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update price alert');
    }
    return res.json();
  }

  static async remove(id: string): Promise<void> {
    const res = await fetch(`${this.BASE_URL}/price-alerts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete price alert');
  }
}
