'use client';

import Header from './Header';
import { useSession } from '../SessionProvider';

export default function HeaderWithSession() {
  const { user } = useSession();
  // Ensure user object matches Header's expected prop types
  const headerUser = user
    ? {
        name: user.name || '',
        email: user.email || '',
        role: user.role,
      }
    : null;
  return <Header user={headerUser} />;
}
