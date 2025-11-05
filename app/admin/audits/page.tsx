import AuditTable from '@/components/admin/AuditTable';

export default function AdminAuditsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">Recent admin actions (order status changes, etc.)</p>
      </div>

      <AuditTable />
    </div>
  );
}
