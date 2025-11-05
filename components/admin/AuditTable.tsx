"use client";

import { useState, useEffect, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AuditTable() {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [orderIdFilter, setOrderIdFilter] = useState('');
  const [adminEmailFilter, setAdminEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchAudits = useCallback(async (p = page, l = limit) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: String(l) });
      if (orderIdFilter) qs.set('orderId', orderIdFilter);
      if (adminEmailFilter) qs.set('adminEmail', adminEmailFilter);
      if (actionFilter) qs.set('action', actionFilter);
      const res = await fetch(`/api/admin/audits?${qs.toString()}`);
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setAudits(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
    } catch (err) {
      console.error(err);
      setAudits([]);
    } finally { setLoading(false); }
  }, [page, limit, orderIdFilter, adminEmailFilter, actionFilter]);

  useEffect(() => { fetchAudits(); }, [fetchAudits]);

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input placeholder="Order ID" className="border rounded px-2 py-1" value={orderIdFilter} onChange={(e) => setOrderIdFilter(e.target.value)} />
        <input placeholder="Admin email" className="border rounded px-2 py-1" value={adminEmailFilter} onChange={(e) => setAdminEmailFilter(e.target.value)} />
        <input placeholder="Action" className="border rounded px-2 py-1" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} />
        <Button onClick={() => { setPage(1); fetchAudits(1, limit); }}>Apply</Button>
        <Button onClick={() => { setOrderIdFilter(''); setAdminEmailFilter(''); setActionFilter(''); setPage(1); fetchAudits(1, limit); }}>Clear</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Admin</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Before</TableHead>
            <TableHead>After</TableHead>
            <TableHead>Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7}>Loading...</TableCell></TableRow>
          ) : audits.length === 0 ? (
            <TableRow><TableCell colSpan={7}>No audit entries</TableCell></TableRow>
          ) : audits.map((a) => (
            <TableRow key={a._id}>
              <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
              <TableCell>{a.adminId?.name || a.adminId?.email || '—'}</TableCell>
              <TableCell>{a.orderId?.orderId || a.orderId || '—'}</TableCell>
              <TableCell><Badge>{a.action}</Badge></TableCell>
              <TableCell>{a.before || '—'}</TableCell>
              <TableCell>{a.after || '—'}</TableCell>
              <TableCell>{a.reason || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between p-4">
        <div>Total: {total}</div>
        <div className="flex gap-2 items-center">
          <Button onClick={() => { if (page > 1) { setPage(p => p - 1); fetchAudits(page - 1, limit); } }} disabled={page <= 1}>Prev</Button>
          <div>Page {page} / {totalPages}</div>
          <Button onClick={() => { if (page * limit < total) { setPage(p => p + 1); fetchAudits(page + 1, limit); } }} disabled={page * limit >= total}>Next</Button>
        </div>
      </div>
    </div>
  );
}
