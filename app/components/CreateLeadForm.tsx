'use client';

import { useState } from 'react';
import { getToken } from '../lib/auth';

export default function CreateLeadForm({ onCreated }: any) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const token = getToken();

    await fetch('http://localhost:3001/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        status: 'new',
      }),
    });

    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');

    onCreated();
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        marginBottom: '20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}
    >
      <input placeholder="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <input placeholder="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input placeholder="Teléfono" value={phone} onChange={(e) => setPhone(e.target.value)} />

      <button 
        type="submit"
        style={{
          background: '#111',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '6px'
        }}
      >
        Crear Lead
      </button>
    </form>
  );
}
