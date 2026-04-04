'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(135deg, #081120 0%, #0f172a 45%, #111827 100%)',
        padding: 24,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(17, 24, 39, 0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          padding: 28,
          boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: 1.2,
              color: '#22c55e',
              marginBottom: 8,
            }}
          >
            CRM DEMO
          </div>

          <h1
            style={{
              fontSize: 30,
              lineHeight: 1.1,
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              marginBottom: 8,
            }}
          >
            Iniciar sesión
          </h1>

          <p
            style={{
              margin: 0,
              color: '#9ca3af',
              fontSize: 14,
            }}
          >
            Accede con el usuario real del backend JWT.
          </p>
        </div>

        <label
          style={{
            display: 'block',
            color: '#e5e7eb',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Email
        </label>

        <input
          type="email"
          placeholder="admin@crm.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 16,
            borderRadius: 10,
            border: '1px solid #374151',
            background: '#111827',
            color: '#ffffff',
            outline: 'none',
            fontSize: 14,
          }}
        />

        <label
          style={{
            display: 'block',
            color: '#e5e7eb',
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Contraseña
        </label>

        <input
          type="password"
          placeholder="123456"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: 12,
            marginBottom: 18,
            borderRadius: 10,
            border: '1px solid #374151',
            background: '#111827',
            color: '#ffffff',
            outline: 'none',
            fontSize: 14,
          }}
        />

        {error ? (
          <div
            style={{
              background: 'rgba(127, 29, 29, 0.28)',
              border: '1px solid #ef4444',
              color: '#fecaca',
              padding: 12,
              borderRadius: 10,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 13,
            background: loading ? '#166534' : '#22c55e',
            color: '#04130a',
            borderRadius: 10,
            border: 'none',
            fontWeight: 800,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}