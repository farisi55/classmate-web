import { useEffect, useState } from 'react';
import type { TickerMessage } from '../../lib/types';

type SaveState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

/** Fase 2 admin UI for editing the 3 running-header messages. Route this
 * page (/admin) behind Cloudflare Access in the Cloudflare dashboard —
 * this component does not implement its own login, per the architectural
 * decision in knowledge.md §3 (Cloudflare Access over custom auth). */
export default function AdminTickerForm() {
  const [messages, setMessages] = useState<TickerMessage[]>([]);
  const [state, setState] = useState<SaveState>('loading');

  useEffect(() => {
    fetch('/api/ticker')
      .then((res) => res.json())
      .then((json: { data: TickerMessage[] }) => {
        setMessages(json.data ?? []);
        setState('idle');
      })
      .catch(() => setState('error'));
  }, []);

  function updateField(
    index: number,
    field: keyof TickerMessage,
    value: string | boolean | number,
  ) {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  async function handleSave() {
    setState('saving');
    try {
      const res = await fetch('/api/admin/ticker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: messages }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('saved');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('error');
    }
  }

  if (state === 'loading') {
    return <p className="text-sm text-ink-soft">Memuat pesan ticker...</p>;
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-ink-soft mb-6">
        Maksimum 3 pesan aktif tampil bergantian di bar atas situs. Isi versi Indonesia dan Inggris
        untuk masing-masing.
      </p>

      <div className="space-y-6">
        {messages.map((msg, i) => (
          <fieldset key={msg.id} className="card p-5 border-2 border-border">
            <legend className="font-display font-semibold px-1">Pesan {i + 1}</legend>

            <label className="block text-xs font-semibold mb-1 mt-2">Teks (Indonesia)</label>
            <input
              type="text"
              value={msg.text_id}
              onChange={(e) => updateField(i, 'text_id', e.target.value)}
              className="w-full rounded-sm border-2 border-ink/10 px-3 py-2 text-sm mb-3"
              maxLength={140}
            />

            <label className="block text-xs font-semibold mb-1">Teks (English)</label>
            <input
              type="text"
              value={msg.text_en}
              onChange={(e) => updateField(i, 'text_en', e.target.value)}
              className="w-full rounded-sm border-2 border-ink/10 px-3 py-2 text-sm mb-3"
              maxLength={140}
            />

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={msg.active}
                onChange={(e) => updateField(i, 'active', e.target.checked)}
              />
              Aktif / tampilkan
            </label>
          </fieldset>
        ))}
      </div>

      <button onClick={handleSave} disabled={state === 'saving'} className="btn-primary mt-6">
        {state === 'saving' ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>

      {state === 'saved' && (
        <p className="text-sm text-kiwi font-semibold mt-3">
          Tersimpan — perubahan langsung tayang.
        </p>
      )}
      {state === 'error' && (
        <p className="text-sm text-folly font-semibold mt-3">
          Gagal memuat/menyimpan. Pastikan kamu sudah login lewat Cloudflare Access dan KV namespace
          sudah terhubung.
        </p>
      )}
    </div>
  );
}
