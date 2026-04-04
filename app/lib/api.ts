import { getToken, saveToken, removeToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://crm-backend-hzth.onrender.com';
type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = 'Error en la solicitud';

    try {
      const errorData = await response.json();
      if (Array.isArray(errorData.message)) {
        message = errorData.message.join(', ');
      } else if (typeof errorData.message === 'string') {
        message = errorData.message;
      }
    } catch {
      // sin cuerpo JSON
    }

    throw new Error(message);
  }

  return response.json();
}

export type LoginResponse = {
  access_token: string;
  user?: {
    id: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
  };
};

export type ProfileResponse = {
  id: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
};

export type Lead = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function login(email: string, password: string) {
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  saveToken(data.access_token);
  return data;
}

export async function fetchProfile() {
  return request<ProfileResponse>('/auth/profile', {
    method: 'GET',
    auth: true,
  });
}

export async function fetchLeads() {
  return request<Lead[]>('/leads', {
    method: 'GET',
    auth: true,
  });
}

export function logout() {
  removeToken();
}

export { API_URL };