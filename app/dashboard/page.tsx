'use client';

import { useEffect, useState } from 'react';
import { fetchLeads } from '../lib/api';
import { getToken, removeToken } from '../lib/auth';
import { useRouter } from 'next/navigation';
import SalesChart from '../components/SalesChart';

type Lead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

export default function DashboardPage() {
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
      .then((data) => setLeads(data))
      .catch((error) => {
        if (error.message === 'NO_TOKEN' || error.message === 'UNAUTHORIZED') {
          removeToken();
          router.push('/login');
          return;
        }

        console.error('Error cargando dashboard:', error);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="page-title">Cargando dashboard...</div>;
  }

  const total = leads.length;
  const nuevos = leads.filter((l) => l.status === 'new').length;
  const gestion = leads.filter((l) => l.status === 'contacted').length;
  const cierre = leads.filter((l) => l.status === 'closed').length;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Leads</div>
          <div className="kpi-value">{total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Nuevos</div>
          <div className="kpi-value">{nuevos}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">En gestión</div>
          <div className="kpi-value">{gestion}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cierre</div>
          <div className="kpi-value">{cierre}</div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-title">Resumen Comercial</div>
          <SalesChart />
        </div>

        <div className="panel">
          <div className="panel-title">Estado</div>
          <p style={{ color: '#64748b' }}>
            CRM funcionando con autenticación real
          </p>
        </div>
      </div>
    </div>
  );
}