"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountSettingsPage() {
  const router = useRouter();

  // Settings page has been removed; redirect users to home
  useEffect(() => {
    router.push('/');
  }, [router]);

  return (
    <div className="p-6 text-center">
      <p>Account settings have been removed.</p>
    </div>
  );
}
