'use client';

import { useEffect, useState } from 'react';

export default function AdminRateLimiterClient() {
  const [keys, setKeys] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [cursor, setCursor] = useState<string>('0');
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [redisHealth, setRedisHealth] = useState<{
    configured: boolean;
    connected: boolean;
    mode: 'redis' | 'fallback';
  } | null>(null);

  async function fetchKeys(reset = true) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (category) params.set('category', category);
      if (!reset && cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/admin/rate-limiter?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const incoming = data.keys || [];
      if (reset) {
        setKeys(incoming);
      } else {
        setKeys((s) => [...s, ...incoming]);
      }
      setCursor(data.nextCursor || '0');
      setHasMore((data.nextCursor || '0') !== '0');
      if (data.redis) setRedisHealth(data.redis);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Reset when category changes
    setCursor('0');
    fetchKeys(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  async function clearKey(k: string) {
    if (!confirm(`Clear key: ${k}?`)) return;
    try {
      const res = await fetch('/api/admin/rate-limiter', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) });
      if (!res.ok) throw new Error(await res.text());
      // refresh current page
      setCursor('0');
      await fetchKeys(true);
      alert('Cleared');
    } catch (err: any) {
      alert('Error clearing: ' + (err?.message || err));
    }
  }

  return (
    <div className="border rounded p-4">
      {redisHealth && (
        <div
          className={`mb-4 rounded p-3 text-sm ${
            redisHealth.connected
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {redisHealth.connected ? (
            <>
              <strong>✓ Redis Connected</strong>
              <div className="mt-1">Distributed rate limiting active</div>
            </>
          ) : (
            <>
              <strong>⚠ Redis Offline</strong>
              <div className="mt-1">Using local fallback limiter</div>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm">Category:</label>
        <select value={category} onChange={(e) => setCategory(e.target.value || undefined)} className="px-2 py-1 border rounded">
          <option value="">All</option>
          <option value="fail">Fail keys</option>
          <option value="block">Blocked keys</option>
          <option value="comboFail">Combo (IP+Account) failed</option>
          <option value="comboBlock">Combo blocked</option>
        </select>
        <button className="btn ml-auto" onClick={() => { setCursor('0'); fetchKeys(true); }}>Refresh</button>
      </div>

      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <table className="w-full text-sm table-auto">
          <thead>
            <tr>
              <th className="text-left p-2">Key</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Attempts</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && (
              <tr><td colSpan={4} className="p-2">No keys found</td></tr>
            )}
            {keys.map((k: any) => (
              <tr key={k.key} className="border-t">
                <td className="p-2 break-all">{k.key}</td>
                <td className="p-2">{k.type}</td>
                <td className="p-2">{k.attempts ?? '-'}</td>
                <td className="p-2"><button className="btn btn-sm" onClick={() => clearKey(k.key)}>Clear</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="mt-4 flex items-center gap-2">
        <button className="btn" onClick={() => fetchKeys(false)} disabled={!hasMore}>Load more</button>
        <div className="text-sm text-muted-foreground">{hasMore ? 'More available' : 'End of results'}</div>
      </div>
    </div>
  );
}

