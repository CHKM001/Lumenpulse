"use client";

import React, { useState } from 'react';
import { usePriceAlerts } from '@/hooks/use-price-alerts';
import { Plus, Trash2, Edit3 } from 'lucide-react';

export default function PriceAlertsPanel() {
  const { rules, isLoading, error, createRule, updateRule, removeRule, refresh, isSyncing } = usePriceAlerts();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', targetPrice: '', condition: 'above', channel: 'push' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validation
    if (!form.symbol.trim() || !form.targetPrice || isNaN(Number(form.targetPrice)) || !form.condition || !form.channel) {
      alert('Please fill asset, threshold, direction and notification channel');
      return;
    }
    setSubmitting(true);
    try {
      await createRule({ symbol: form.symbol.trim(), targetPrice: Number(form.targetPrice), condition: form.condition as any });
      setShowForm(false);
      setForm({ symbol: '', targetPrice: '', condition: 'above', channel: 'push' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await removeRule(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  if (isLoading) return <div>Loading price alerts...</div>;

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Price alerts</h3>
        <div className="flex items-center gap-2">
          {isSyncing && <span className="text-sm text-gray-400">Syncing...</span>}
          <button onClick={() => setShowForm(true)} className="px-2 py-1 bg-blue-500 rounded text-white flex items-center gap-2"><Plus size={14}/> New</button>
        </div>
      </div>

      {error && <div className="text-sm text-red-400 mb-2">{error}</div>}

      {rules.length === 0 ? (
        <div className="text-sm text-gray-400">No price alerts configured.</div>
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className="flex items-center justify-between p-2 bg-white/2 rounded">
              <div>
                <div className="font-medium text-white">{r.symbol} <span className="text-xs text-gray-400">{r.condition} {r.targetPrice}</span></div>
                <div className="text-xs text-gray-400">State: {r.isActive ? (r.lastTriggeredAt ? 'triggered' : 'active') : 'muted'}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateRule(r.id, { isActive: !r.isActive })} className="p-1 rounded hover:bg-white/5"><Edit3 size={14} /></button>
                <button onClick={() => handleDelete(r.id)} className="p-1 rounded hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-gray-900 border border-white/10 rounded-xl p-6 w-96 max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white">New price alert</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-400">Close</button>
            </div>
            <label className="text-sm text-gray-300">Asset symbol</label>
            <input value={form.symbol} onChange={(e) => setForm({...form, symbol: e.target.value})} className="w-full mb-2 p-2 rounded bg-white/5" />
            <label className="text-sm text-gray-300">Target price</label>
            <input value={form.targetPrice} onChange={(e) => setForm({...form, targetPrice: e.target.value})} className="w-full mb-2 p-2 rounded bg-white/5" />
            <label className="text-sm text-gray-300">Direction</label>
            <select value={form.condition} onChange={(e) => setForm({...form, condition: e.target.value})} className="w-full mb-2 p-2 rounded bg-white/5">
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
            <label className="text-sm text-gray-300">Notification channel</label>
            <select value={form.channel} onChange={(e) => setForm({...form, channel: e.target.value})} className="w-full mb-4 p-2 rounded bg-white/5">
              <option value="push">Push</option>
              <option value="email">Email</option>
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-gray-400">Cancel</button>
              <button type="submit" disabled={submitting} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded">Create</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
