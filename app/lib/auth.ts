export async function loginUser(email: string, password: string) {
  const response = await fetch('http://localhost:3001/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Credenciales incorrectas');
  }

  return response.json();
}

export function saveToken(token: string) {
  localStorage.setItem('crm_token', token);
}

export function getToken() {
  return localStorage.getItem('crm_token');
}

export function removeToken() {
  localStorage.removeItem('crm_token');
}