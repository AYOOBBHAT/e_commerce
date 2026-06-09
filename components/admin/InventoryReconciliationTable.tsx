'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  InventoryReconciliationReport,
  ProductReconciliationRow,
  ReconciliationConfidence,
} from '@/lib/inventory/types';
import {
  hasInventoryAuditHistoryIndicator,
  inventoryAuditLogHref,
} from '@/lib/inventory/audit-history-indicator';

type InventoryReconciliationTableProps = {
  report: InventoryReconciliationReport;
};

type ConfidenceFilter = 'all' | ReconciliationConfidence;

function confidenceBadgeVariant(
  confidence: ReconciliationConfidence,
): 'default' | 'secondary' | 'outline' {
  switch (confidence) {
    case 'high':
      return 'default';
    case 'medium':
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatQuantity(value: number | null): string {
  if (value === null) {
    return '—';
  }
  return String(value);
}

function formatDelta(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

export default function InventoryReconciliationTable({
  report,
}: InventoryReconciliationTableProps) {
  const [search, setSearch] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');
  const [driftOnly, setDriftOnly] = useState(false);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return report.products.filter((product) => {
      if (driftOnly && (product.delta === null || product.delta === 0)) {
        return false;
      }

      if (confidenceFilter !== 'all' && product.confidence !== confidenceFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query)
      );
    });
  }, [report.products, search, confidenceFilter, driftOnly]);

  const summary = report.summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryTile label="Total Products" value={summary.totalProducts} />
        <SummaryTile label="Drifted Products" value={summary.driftedProducts} highlight />
        <SummaryTile label="High Confidence" value={summary.highConfidenceProducts} />
        <SummaryTile label="Medium Confidence" value={summary.mediumConfidenceProducts} />
        <SummaryTile label="Low Confidence" value={summary.lowConfidenceProducts} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Search by name or slug"
          className="border rounded px-3 py-2 text-sm w-full sm:max-w-xs"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="border rounded px-3 py-2 text-sm"
          value={confidenceFilter}
          onChange={(event) =>
            setConfidenceFilter(event.target.value as ConfidenceFilter)
          }
        >
          <option value="all">All confidence</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={driftOnly}
            onChange={(event) => setDriftOnly(event.target.checked)}
          />
          Show drift only
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setSearch('');
            setConfidenceFilter('all');
            setDriftOnly(false);
          }}
        >
          Clear filters
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Delta</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No products match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <ProductRow key={product.productId} product={product} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Reconciliation generated at{' '}
        {new Date(report.generatedAt).toLocaleString()} · Showing {filteredProducts.length}{' '}
        of {report.products.length} products
      </p>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        highlight ? 'border-amber-200 bg-amber-50/50' : 'bg-muted/30'
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function ProductRow({ product }: { product: ProductReconciliationRow }) {
  const showAuditIndicator = hasInventoryAuditHistoryIndicator(
    product.notes,
    product.expectedQuantity,
  );

  return (
    <TableRow>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{product.slug || '—'}</TableCell>
      <TableCell className="text-right tabular-nums">{product.actualQuantity}</TableCell>
      <TableCell className="text-right tabular-nums">
        {formatQuantity(product.expectedQuantity)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <span
          className={
            product.delta !== null && product.delta !== 0
              ? 'font-semibold text-amber-700'
              : undefined
          }
        >
          {formatDelta(product.delta)}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={confidenceBadgeVariant(product.confidence)}>
          {product.confidence}
        </Badge>
      </TableCell>
      <TableCell className="max-w-md">
        <div className="space-y-1 text-xs text-muted-foreground">
          {product.notes.length === 0 ? (
            <span>—</span>
          ) : (
            product.notes.map((note) => (
              <p key={`${product.productId}-${note}`}>{note}</p>
            ))
          )}
          {showAuditIndicator ? (
            <Link
              href={inventoryAuditLogHref()}
              className="inline-flex items-center text-primary underline-offset-2 hover:underline"
            >
              Audit history available
            </Link>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
