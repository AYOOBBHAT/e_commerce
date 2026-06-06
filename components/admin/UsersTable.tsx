'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal, Shield, ShieldOff, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        
        // Fetch order counts for each user
        const usersWithOrders = await Promise.all(
          data.map(async (user: any) => {
            try {
              const ordersRes = await fetch(`/api/admin/users/${user._id}/orders`);
              const ordersData = ordersRes.ok ? await ordersRes.json() : [];
              return {
                ...user,
                ordersCount: ordersData.length || 0,
              };
            } catch {
              return { ...user, ordersCount: 0 };
            }
          })
        );
        
        setUsers(usersWithOrders);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (!confirm(`Are you sure you want to ${newRole === 'admin' ? 'promote' : 'demote'} this user?`)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh the users list
      window.location.reload();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user role');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Refresh the users list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="p-6 text-center text-muted-foreground">Loading users...</div>;

  return (
    <div className="rounded-lg border-2 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900 min-w-[250px]">User</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[120px]">Role</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[150px]">Joined Date</TableHead>
              <TableHead className="font-semibold text-gray-900 min-w-[100px]">Orders</TableHead>
              <TableHead className="text-right font-semibold text-gray-900 min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id || user.id} className="hover:bg-gray-50">
                  <TableCell className="py-4">
                    <div>
                      <div className="font-semibold text-gray-900">{user.name || '—'}</div>
                      <div className="text-sm text-gray-500">
                        {user.email || '—'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className={user.role === 'admin' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}
                    >
                      {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-medium">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '—'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-gray-700 font-semibold">{user.ordersCount || 0}</span>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100 text-gray-700 hover:text-gray-900">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-2 shadow-lg">
                        {user.role === 'user' ? (
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(user._id || user.id, 'admin')}
                            disabled={isUpdating}
                            className="flex items-center text-gray-900 hover:bg-gray-100"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUpdateRole(user._id || user.id, 'user')}
                            disabled={isUpdating}
                            className="flex items-center text-gray-900 hover:bg-gray-100"
                          >
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(user._id || user.id)}
                          disabled={isUpdating}
                          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}