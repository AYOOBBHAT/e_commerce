import React from 'react';
import { getServerSession } from '@/lib/auth';
import AdminRateLimiterClient from '@/components/admin/AdminRateLimiterClient';

export default async function Page() {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Rate limiter admin</h1>
        <p className="mt-4 text-red-600">Unauthorized - admin access required.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Rate limiter admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">View and clear blocked keys and attempt counters.</p>
      <div className="mt-6">
        {/* Client component handles interactive listing and clearing */}
        <AdminRateLimiterClient />
      </div>
    </div>
  );
}
