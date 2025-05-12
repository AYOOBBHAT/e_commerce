import { Users } from 'lucide-react';
import UsersTable from '@/components/admin/UsersTable';

export default function AdminUsers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage user accounts</p>
      </div>

      <UsersTable />
    </div>
  );
}