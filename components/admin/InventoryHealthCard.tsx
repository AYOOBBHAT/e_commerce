'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InventoryHealthReport } from '@/lib/inventory/types';

type InventoryHealthCardProps = {
  health: InventoryHealthReport;
};

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function InventoryHealthCard({ health }: InventoryHealthCardProps) {
  const metrics = [
    { label: 'Negative Stock Products', value: health.negativeStockProducts },
    { label: 'Stuck Finalizing Orders', value: health.stuckFinalizingOrders },
    { label: 'Stuck Reserved Orders', value: health.stuckReservedOrders },
    { label: 'Stuck Restoring Orders', value: health.stuckRestoringOrders },
    { label: 'Inventory Mismatch Orders', value: health.inventoryMismatchOrders },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Inventory Health</CardTitle>
        <Badge variant={health.healthy ? 'default' : 'destructive'}>
          {health.healthy ? 'Healthy' : 'Unhealthy'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border bg-muted/30 px-3 py-2"
            >
              <dt className="text-xs text-muted-foreground">{metric.label}</dt>
              <dd className="text-lg font-semibold tabular-nums">{metric.value}</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-muted-foreground">
          Generated at {formatGeneratedAt(health.generatedAt)}
        </p>
      </CardContent>
    </Card>
  );
}
