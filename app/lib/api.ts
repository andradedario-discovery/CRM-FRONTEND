import { getToken, removeToken } from '@/app/lib/auth';

export async function fetchLeads() {
  const token = getToken();

  if (!token) {
    throw new Error('NO_TOKEN');
  }

  const response = await fetch('http://localhost:3001/leads', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    removeToken();
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error en la petición');
  }

  return response.json();
}