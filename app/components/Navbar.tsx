'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeToken } from '../lib/auth';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', gap: '16px' }}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/users">Usuarios</Link>
      </div>

      <button
        onClick={handleLogout}
        style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          background: '#f5f5f5',
          cursor: 'pointer',
        }}
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
