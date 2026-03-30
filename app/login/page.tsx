'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchLeads } from '@/app/lib/api';
import { getToken, removeToken } from '@/app/lib/auth';

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push('/login');
      return;
    }

    fetchLeads()
      .then((data) => {
        setLeads(data);
      })
      .catch((error) => {
        if (error.message === 'NO_TOKEN' || error.message === 'UNAUTHORIZED') {
          removeToken();
          router.push('/login');
          return;
        }

        console.error('Error cargando leads:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <div className="page-title">Cargando leads...</div>;
  }

  return (
    <div>
      <h1 className="page-title">Ventas / Leads</h1>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Leads</div>
          <div className="kpi-value">{leads.length}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Nuevos</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status === 'new').length}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">En gestión</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status === 'contacted').length}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cierre</div>
          <div className="kpi-value">
            {leads.filter((l) => l.status === 'closed').length}
          </div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-title">Actividad Comercial</div>
          <p style={{ color: '#64748b' }}>
            Aquí pondremos el gráfico tipo Power BI en el siguiente paso
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">Resumen</div>
          <p style={{ color: '#64748b' }}>
            Conversión, pipeline, performance
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <div className="panel-title">Lista de Leads</div>

        <input className="search-input" placeholder="Buscar..." />

        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  {lead.firstName} {lead.lastName}
                </td>
                <td>{lead.email}</td>
                <td>
                  <span className="status-badge">{lead.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}