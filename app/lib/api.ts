import { getToken, removeToken } from '@/app/lib/auth';

export async function fetchLeads() {
  const token = getToken();

  if (!token) {
    return [];
  }

  const response = await fetch('http://localhost:3001/leads', {
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