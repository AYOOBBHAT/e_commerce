'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AlertItem, AlertSeverity, AlertSummary } from '@/lib/alerts/types';

const AUDIT_LOG_PATH = '/admin/audits';

type InventoryAlertsPanelProps = {
  alerts: AlertItem[];
  summary: AlertSummary;
  generatedAt: string;
};

const SEVERITY_SECTIONS: AlertSeverity[] = ['critical', 'warning', 'info'];

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: 'Critical Alerts',
  warning: 'Warning Alerts',
  info: 'Info Alerts',
};

const SEVERITY_BADGE: Record<
  AlertSeverity,
  'destructive' | 'secondary' | 'outline'
> = {
  critical: 'destructive',
  warning: 'secondary',
  info: 'outline',
};

const SEVERITY_CARD_CLASS: Record<AlertSeverity, string> = {
  critical: 'border-red-200 bg-red-50/60',
  warning: 'border-amber-200 bg-amber-50/60',
  info: 'border-sky-200 bg-sky-50/40',
};

export default function InventoryAlertsPanel({
  alerts,
  summary,
  generatedAt,
}: InventoryAlertsPanelProps) {
  const grouped = groupAlertsBySeverity(alerts);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Alert Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryStat label="Critical" value={summary.critical} tone="critical" />
            <SummaryStat label="Warning" value={summary.warning} tone="warning" />
            <SummaryStat label="Info" value={summary.info} tone="info" />
            <SummaryStat label="Total" value={summary.total} tone="neutral" />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Alerts generated at {new Date(generatedAt).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {SEVERITY_SECTIONS.map((severity) => (
        <AlertSection
          key={severity}
          severity={severity}
          items={grouped[severity]}
        />
      ))}

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            No operational inventory alerts at this time.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function groupAlertsBySeverity(
  alerts: AlertItem[],
): Record<AlertSeverity, AlertItem[]> {
  return {
    critical: alerts.filter((alert) => alert.severity === 'critical'),
    warning: alerts.filter((alert) => alert.severity === 'warning'),
    info: alerts.filter((alert) => alert.severity === 'info'),
  };
}

function AlertSection({
  severity,
  items,
}: {
  severity: AlertSeverity;
  items: AlertItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={SEVERITY_CARD_CLASS[severity]}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {SEVERITY_LABEL[severity]}
          <Badge variant={SEVERITY_BADGE[severity]}>{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((alert) => (
          <div
            key={alert.id}
            className="rounded-md border bg-background/80 px-3 py-2 text-sm"
          >
            <p className="font-medium">{alert.title}</p>
            <p className="mt-1 text-muted-foreground">{alert.description}</p>
            {alert.auditHistoryAvailable ? (
              <Link
                href={AUDIT_LOG_PATH}
                className="mt-2 inline-block text-xs text-primary underline-offset-2 hover:underline"
              >
                Audit history available
              </Link>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'critical' | 'warning' | 'info' | 'neutral';
}) {
  const valueClass =
    tone === 'critical'
      ? 'text-red-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'info'
          ? 'text-sky-700'
          : 'text-foreground';

  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-xl font-semibold tabular-nums ${valueClass}`}>{value}</dd>
    </div>
  );
}
