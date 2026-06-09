'use client';

import { useCallback, useEffect, useState } from 'react';
import InventoryAlertsPanel from '@/components/admin/InventoryAlertsPanel';
import InventoryHealthCard from '@/components/admin/InventoryHealthCard';
import InventoryReconciliationTable from '@/components/admin/InventoryReconciliationTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AlertItem } from '@/lib/alerts/types';
import { getAlertSummary } from '@/lib/alerts/types';
import type {
  InventoryHealthReport,
  InventoryReconciliationReport,
} from '@/lib/inventory/types';

type AdminAlertsPayload = {
  generatedAt: string;
  alerts: AlertItem[];
};

export default function InventoryDashboardPage() {
  const [health, setHealth] = useState<InventoryHealthReport | null>(null);
  const [reconciliation, setReconciliation] =
    useState<InventoryReconciliationReport | null>(null);
  const [adminAlerts, setAdminAlerts] = useState<AdminAlertsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [healthRes, reconciliationRes, alertsRes] = await Promise.all([
        fetch('/api/admin/inventory/health'),
        fetch('/api/admin/inventory/reconciliation'),
        fetch('/api/admin/alerts'),
      ]);

      if (!healthRes.ok || !reconciliationRes.ok || !alertsRes.ok) {
        throw new Error('Failed to load inventory dashboard data');
      }

      const [healthJson, reconciliationJson, alertsJson] = await Promise.all([
        healthRes.json() as Promise<InventoryHealthReport>,
        reconciliationRes.json() as Promise<InventoryReconciliationReport>,
        alertsRes.json() as Promise<AdminAlertsPayload>,
      ]);

      setHealth(healthJson);
      setReconciliation(reconciliationJson);
      setAdminAlerts(alertsJson);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load inventory data';
      setError(message);
      setHealth(null);
      setReconciliation(null);
      setAdminAlerts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <p className="text-muted-foreground">Loading inventory dashboard…</p>
      </div>
    );
  }

  if (error || !health || !reconciliation || !adminAlerts) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card className="border-destructive/40">
          <CardContent className="py-6">
            <p className="text-destructive">{error ?? 'Inventory data unavailable'}</p>
            <button
              type="button"
              className="mt-3 text-sm underline"
              onClick={() => void loadDashboard()}
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader />

      <InventoryAlertsPanel
        alerts={adminAlerts.alerts}
        summary={getAlertSummary(adminAlerts.alerts)}
        generatedAt={adminAlerts.generatedAt}
      />

      <InventoryHealthCard health={health} />

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryReconciliationTable report={reconciliation} />
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Inventory Monitoring</h1>
      <p className="text-muted-foreground">
        Read-only operational view of inventory health, alerts, and audit-derived reconciliation.
      </p>
    </div>
  );
}
