'use client';

import { useEffect, useState } from 'react';
import { fetchLeads } from '@/app/lib/api';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    fetchLeads().then(setLeads);
  }, []);

  return (
    <div>
      <h1 className="page-title">Ventas / Leads</h1>

      {/* KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Leads</div>
          <div className="kpi-value">{leads.length}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Nuevos</div>
          <div className="kpi-value">
            {leads.filter(l => l.status === 'new').length}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">En gestión</div>
          <div className="kpi-value">
            {leads.filter(l => l.status === 'contacted').length}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Cierre</div>
          <div className="kpi-value">
            {leads.filter(l => l.status === 'closed').length}
          </div>
        </div>
      </div>

      {/* PANEL */}
      <div className="panel-grid">
        <div className="panel">
          <div className="panel-title">Actividad Comercial</div>
          <p style={{ color: '#64748b' }}>
            Aquí irá gráfico tipo Power BI (siguiente paso)
          </p>
        </div>

        <div className="panel">
          <div className="panel-title">Resumen</div>
          <p style={{ color: '#64748b' }}>
            Conversión, pipeline, performance
          </p>
        </div>
      </div>

      {/* TABLA */}
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
                <td>{lead.firstName} {lead.lastName}</td>
                <td>{lead.email}</td>
                <td>
                  <span className="status-badge">
                    {lead.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}