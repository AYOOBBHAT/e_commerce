export type AlertSeverity = 'critical' | 'warning' | 'info';

export type AlertCategory = 'inventory' | 'payment' | 'system';

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  description: string;
  createdAt: string;
  /** When true, UI may link to /admin/audits for inventory event history. */
  auditHistoryAvailable?: boolean;
}

export type AlertSummary = {
  critical: number;
  warning: number;
  info: number;
  total: number;
};

export type AdminAlertsResponse = {
  generatedAt: string;
  alerts: AlertItem[];
  summary: AlertSummary;
};

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export function sortAlerts(alerts: AlertItem[]): AlertItem[] {
  return [...alerts].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function getAlertSummary(alerts: AlertItem[]): AlertSummary {
  const summary = {
    critical: 0,
    warning: 0,
    info: 0,
    total: alerts.length,
  };

  for (const alert of alerts) {
    summary[alert.severity] += 1;
  }

  return summary;
}
