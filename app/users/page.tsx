'use client';

import { useEffect, useState } from 'react';
import { fetchLeads } from '../lib/api';
import CreateLeadForm from '../components/CreateLeadForm';

export default function UsersPage() {
  const [leads, setLeads] = useState<any[]>([]);

  const loadLeads = () => {
    fetchLeads().then(setLeads).catch(() => {});
  };

  useEffect(() => {
    loadLeads();
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Leads</h1>

      <CreateLeadForm onCreated={loadLeads} />

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>{lead.firstName} {lead.lastName}</td>
              <td>{lead.email}</td>
              <td>{lead.phone}</td>
              <td>{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
