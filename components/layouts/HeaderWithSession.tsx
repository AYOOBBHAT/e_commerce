'use client';

import Header from './Header';
import { useSession } from '../SessionProvider';
import type { NavCategory } from '@/lib/category-types';

type HeaderWithSessionProps = {
  navCategories: NavCategory[];
};

export default function HeaderWithSession({ navCategories }: HeaderWithSessionProps) {
  const { user } = useSession();
  const headerUser = user
    ? {
        name: user.name || '',
        email: user.email || '',
        role: user.role,
      }
    : null;
  return <Header user={headerUser} navCategories={navCategories} />;
}
