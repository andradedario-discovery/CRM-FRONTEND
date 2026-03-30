'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '../lib/auth';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    setAllowed(true);
  }, [router]);

  if (!allowed) return <p>Verificando sesión...</p>;

  return <>{children}</>;
}
