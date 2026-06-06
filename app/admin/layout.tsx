import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session?.userId || session.role !== 'admin') {
    redirect('/login');
  }
  
  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] bg-gray-50 dark:bg-gray-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-950">
        {children}
      </main>
    </div>
  );
}