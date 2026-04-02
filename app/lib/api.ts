import { getToken, removeToken } from '@/app/lib/auth';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const USE_DEMO = !process.env.NEXT_PUBLIC_API_URL;

export type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  status?: string;
  createdAt?: string;
};

const demoLeads: Lead[] = [
  {
    id: '1',
    firstName: 'Carlos',
    lastName: 'Ruiz',
    email: 'carlos@test.com',
    phone: '0993333333',
    company: 'Empresa Tres',
    source: 'referido',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Maria',
    lastName: 'Lopez',
    email: 'maria@test.com',
    phone: '0982222222',
    company: 'Empresa Dos',
    source: 'whatsapp',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '0999999999',
    company: 'Empresa Uno',
    source: 'web',
    status: 'new',
    createdAt: new Date().toISOString(),
  },
];

export async function fetchLeads(): Promise<Lead[]> {
  const token = getToken();

  // 🔥 MODO DEMO (Vercel)
  if (USE_DEMO) {
    console.log('🚀 DEMO MODE ACTIVATED');
    return new Promise((resolve) =>
      setTimeout(() => resolve(demoLeads), 800)
    );
  }

  if (!token) {
    return [];
  }

  const response = await fetch(`${API_URL}/leads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    removeToken();
    return [];
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error en la petición');
  }

  return response.json();
}