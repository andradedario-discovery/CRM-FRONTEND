'use client';

type Props = {
  user: any;
  leads: any[];
};

function getLeadScore(lead: any) {
  let score = 40;

  if (lead.email) score += 10;
  if (lead.phone) score += 15;
  if (lead.company) score += 10;

  const source = String(lead.source || '').toLowerCase();
  const status = String(lead.status || '').toLowerCase();

  if (source.includes('whatsapp')) score += 15;
  if (source.includes('instagram')) score += 10;
  if (source.includes('facebook')) score += 8;
  if (source.includes('call')) score += 12;

  if (status.includes('proposal')) score += 15;
  if (status.includes('contacted')) score += 8;
  if (status.includes('won')) score += 20;
  if (status.includes('lost')) score -= 20;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}

export default function PremiumDashboard({ user, leads }: Props) {
  const totalLeads = leads.length;

  const hotLeads = leads.filter((lead) => getLeadScore(lead) >= 80).length;

  const warmLeads = leads.filter((lead) => {
    const score = getLeadScore(lead);
    return score >= 60 && score < 80;
  }).length;

  const coldLeads = leads.filter((lead) => getLeadScore(lead) < 60).length;

  const conversionRate = totalLeads
    ? Math.round((hotLeads / totalLeads) * 100)
    : 0;

  const recentLeads = leads.filter((lead) => {
    const created = new Date(lead.createdAt || Date.now());
    const now = new Date();
    const days = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    return days <= 7;
  }).length;

  const totalPipeline = leads.reduce((acc, lead) => {
    const amount =
      Number(lead.amount) ||
      Number(lead.value) ||
      Number(lead.budget) ||
      0;

    return acc + amount;
  }, 0);

  const topLeads = [...leads]
    .map((lead) => ({
      ...lead,
      score: getLeadScore(lead),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 20%), linear-gradient(180deg, #020617 0%, #0f172a 100%)',
        color: 'white',
        padding: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              color: '#67e8f9',
              fontSize: '12px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            Discovery Innova
          </p>

          <h1
            style={{
              fontSize: '34px',
              lineHeight: 1.1,
              margin: 0,
              fontWeight: 800,
            }}
          >
            Commercial Intelligence Center
          </h1>

          <p
            style={{
              color: '#94a3b8',
              marginTop: '10px',
              marginBottom: 0,
            }}
          >
            Plataforma comercial avanzada con IA simulada, omnicanal y foco en ventas y cobranzas
          </p>
        </div>

        <div
          style={{
            padding: '14px 18px',
            borderRadius: '16px',
            background: 'rgba(34, 211, 238, 0.12)',
            border: '1px solid rgba(34, 211, 238, 0.25)',
            color: '#67e8f9',
            fontWeight: 700,
          }}
        >
          IA ACTIVA
        </div>
      </div>

      {user && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 18px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#cbd5e1',
          }}
        >
          Bienvenido, <strong style={{ color: 'white' }}>{user.email}</strong> ({user.role})
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '18px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '22px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <p style={{ color: '#94a3b8', marginTop: 0 }}>Pipeline activo</p>
          <h3 style={{ fontSize: '32px', margin: '8px 0 8px 0' }}>
            ${totalPipeline.toLocaleString()}
          </h3>
          <p style={{ color: '#67e8f9', margin: 0 }}>Vista ejecutiva comercial</p>
        </div>

        <div
          style={{
            padding: '22px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <p style={{ color: '#94a3b8', marginTop: 0 }}>Leads totales</p>
          <h3 style={{ fontSize: '32px', margin: '8px 0 8px 0' }}>
            {totalLeads}
          </h3>
          <p style={{ color: '#22c55e', margin: 0 }}>Base conectada a PostgreSQL</p>
        </div>

        <div
          style={{
            padding: '22px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <p style={{ color: '#94a3b8', marginTop: 0 }}>Leads calientes</p>
          <h3 style={{ fontSize: '32px', margin: '8px 0 8px 0' }}>
            {hotLeads}
          </h3>
          <p style={{ color: '#f59e0b', margin: 0 }}>Prioridad alta de cierre</p>
        </div>

        <div
          style={{
            padding: '22px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          <p style={{ color: '#94a3b8', marginTop: 0 }}>Conversión estimada</p>
          <h3 style={{ fontSize: '32px', margin: '8px 0 8px 0' }}>
            {conversionRate ? `${conversionRate}%` : '0%'}
          </h3>
          <p style={{ color: '#a78bfa', margin: 0 }}>Calculado desde scoring real</p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr 1fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '22px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>🧠 Inteligencia Comercial</h2>
          <p style={{ color: '#94a3b8', marginTop: 0 }}>
            Insights automáticos simulados sobre tu operación real
          </p>

          <div style={{ display: 'grid', gap: '14px', marginTop: '18px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(16,185,129,0.10)',
                border: '1px solid rgba(16,185,129,0.20)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '6px' }}>
                Oportunidad de cierre detectada
              </strong>
              <span style={{ color: '#cbd5e1' }}>
                {hotLeads} leads muestran alta intención comercial y deben ser contactados hoy por WhatsApp o llamada.
                {recentLeads > 0 ? ` ${recentLeads} fueron generados en los últimos 7 días.` : ''}
              </span>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.20)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '6px' }}>
                Seguimiento recomendado
              </strong>
              <span style={{ color: '#cbd5e1' }}>
                {warmLeads} leads están en zona media. Una secuencia de seguimiento puede moverlos a propuesta.
              </span>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '18px',
                background: 'rgba(244,63,94,0.10)',
                border: '1px solid rgba(244,63,94,0.20)',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '6px' }}>
                Riesgo de enfriamiento
              </strong>
              <span style={{ color: '#cbd5e1' }}>
                {coldLeads} leads están fríos. Conviene reactivarlos con contenido, remarketing o llamada.
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '22px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '22px',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: '8px' }}>📡 Omnicanal</h2>
          <p style={{ color: '#94a3b8', marginTop: 0 }}>
            Simulación visual lista para demo
          </p>

          <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
            <div
              style={{
                padding: '14px',
                borderRadius: '16px',
                background: 'rgba(34,197,94,0.10)',
                border: '1px solid rgba(34,197,94,0.22)',
              }}
            >
              WhatsApp · 12 conversaciones activas
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '16px',
                background: 'rgba(56,189,248,0.10)',
                border: '1px solid rgba(56,189,248,0.22)',
              }}
            >
              Central telefónica · 8 llamadas hoy
            </div>

            <div
              style={{
                padding: '14px',
                borderRadius: '16px',
                background: 'rgba(168,85,247,0.10)',
                border: '1px solid rgba(168,85,247,0.22)',
              }}
            >
              Redes sociales · Facebook + Instagram conectados visualmente
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '22px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '22px',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: '8px' }}>🔥 Top leads por scoring</h2>
        <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '18px' }}>
          Vista rápida para impacto comercial en demo
        </p>

        <div style={{ display: 'grid', gap: '12px' }}>
          {topLeads.length === 0 ? (
            <div style={{ color: '#cbd5e1' }}>No hay leads todavía.</div>
          ) : (
            topLeads.map((lead, index) => (
              <div
                key={lead.id || index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '18px',
                  background: 'rgba(2,6,23,0.45)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div>
                  <strong style={{ display: 'block', color: 'white' }}>
                    {lead.name || lead.fullName || 'Lead sin nombre'}
                  </strong>
                  <span style={{ color: '#94a3b8' }}>
                    {lead.company || 'Sin empresa'} · {lead.source || 'Canal no definido'}
                  </span>
                </div>

                <div
                  style={{
                    minWidth: '70px',
                    textAlign: 'center',
                    padding: '10px 14px',
                    borderRadius: '999px',
                    background:
                      lead.score >= 80
                        ? 'rgba(16,185,129,0.18)'
                        : lead.score >= 60
                        ? 'rgba(245,158,11,0.18)'
                        : 'rgba(148,163,184,0.18)',
                    color:
                      lead.score >= 80
                        ? '#6ee7b7'
                        : lead.score >= 60
                        ? '#fcd34d'
                        : '#cbd5e1',
                    fontWeight: 800,
                  }}
                >
                  {lead.score}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}