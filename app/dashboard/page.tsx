'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

type RowLike = Record<string, any>;

type DashboardRow = {
  id: string;
  nombre: string;
  telefono: string;
  ciudad: string;
  parroquia: string;
  diasMora: number;
  monto: number;
  garantia: string;
  numeroJuicio: string;
  bloque: string;
  whatsappStatus: string;
  callStatus: string;
  promesa: string;
  proximaAccion: string;
  operador: string;
  gestor: string;
};

type EnrichedRow = DashboardRow & {
  sentiment: 'Positivo' | 'Neutral' | 'Negativo';
  recommendation: string;
  score: number;
  probabilidad: number;
  mejorCanal: 'WhatsApp' | 'Llamada' | 'Mixto' | 'Jurídico';
};

const STORAGE_KEYS = [
  'crm_cobranzas_data_v1',
  'crm_cobranzas_rows_v10',
  'crm_cobranzas_rows',
  'crm_cobranzas_data',
  'crmCobranzasRows',
  'cobranzasRows',
  'uploadedCobranzasRows',
];

const COLORS = {
  bg: '#081225',
  panel: '#0f1c36',
  panelSoft: '#15284b',
  card: '#ffffff',
  text: '#e5eefc',
  textSoft: '#9fb3d9',
  ink: '#0f172a',
  green: '#10b981',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  orange: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  border: 'rgba(255,255,255,0.08)',
};

function getString(row: RowLike, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function parseNumberish(value: any): number {
  if (value === undefined || value === null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let text = String(value).trim();
  if (!text) return 0;

  text = text.replace(/\$/g, '').replace(/\s/g, '');

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');

  if (hasComma && hasDot) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    text = text.replace(',', '.');
  } else {
    text = text.replace(/,/g, '');
  }

  const num = Number(text);
  return Number.isFinite(num) ? num : 0;
}

function getNumber(row: RowLike, keys: string[]) {
  for (const key of keys) {
    const raw = row[key];
    if (raw === undefined || raw === null || raw === '') continue;
    const parsed = parseNumberish(raw);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function normalizeRow(row: RowLike, index: number): DashboardRow {
  return {
    id: getString(row, ['id', 'ID']) || `row-${index}`,
    nombre: getString(row, ['nombre', 'Nombre', 'cliente', 'Cliente']) || `Cliente ${index + 1}`,
    telefono: getString(row, ['telefono', 'Teléfono', 'telefono1', 'Telefono']),
    ciudad: getString(row, ['ciudad', 'Ciudad']) || 'Quito',
    parroquia: getString(row, ['parroquia', 'Parroquia']) || '-',
    diasMora: getNumber(row, ['diasMora', 'DiasMora', 'dias_mora', 'dias mora', 'Días mora']),
    monto: getNumber(row, ['monto', 'Monto', 'obligacionVencida', 'Obligación vencida', 'Obligacion vencida']),
    garantia: getString(row, ['garantia', 'Garantía', 'Garantia']) || 'PAG',
    numeroJuicio: getString(row, ['numeroJuicio', 'NumeroJuicio', 'Juicio', 'juicio']),
    bloque: getString(row, ['bloque', 'Bloque']) || 'Normal',
    whatsappStatus: getString(row, ['whatsappStatus', 'WhatsApp', 'whatsapp', 'estadoWhatsapp']) || 'Sin enviar',
    callStatus: getString(row, ['callStatus', 'Llamada', 'llamada', 'estadoLlamada']) || 'Sin llamar',
    promesa: getString(row, ['promesa', 'Promesa']) || '-',
    proximaAccion: getString(row, ['proximaAccion', 'Próxima acción', 'Proxima accion']) || '-',
    operador: getString(row, ['operador', 'Operador']) || 'Sin operador',
    gestor: getString(row, ['gestor', 'Gestor']) || 'Sin gestor',
  };
}

function loadRowsFromStorage(): DashboardRow[] {
  if (typeof window === 'undefined') return [];

  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, index) => normalizeRow(item, index));
      }
    } catch {}
  }

  return [];
}

function getSentiment(row: DashboardRow): 'Positivo' | 'Neutral' | 'Negativo' {
  const w = (row.whatsappStatus || '').toLowerCase();
  const c = (row.callStatus || '').toLowerCase();

  if (
    w.includes('respond') ||
    c.includes('contest') ||
    row.promesa !== '-' ||
    row.proximaAccion.toLowerCase().includes('seguimiento')
  ) {
    return 'Positivo';
  }

  if (
    c.includes('inválido') ||
    c.includes('invalido') ||
    w.includes('sin respuesta') ||
    row.diasMora > 180
  ) {
    return 'Negativo';
  }

  return 'Neutral';
}

function getIARecommendation(row: DashboardRow): string {
  if (row.numeroJuicio || row.diasMora >= 180) return 'Sugerido jurídico';
  if (row.promesa !== '-' || row.whatsappStatus === 'Respondió') return 'Alta probabilidad de recuperación';
  if (row.callStatus === 'Número inválido') return 'Depurar base';
  if (row.callStatus === 'No contestó' && row.diasMora >= 90) return 'Reintento intensivo';
  return 'Seguimiento comercial';
}

function getScore(row: DashboardRow) {
  let score = 50;

  if (row.promesa !== '-') score += 25;
  if ((row as any).whatsappStatus === 'Respondió') score += 18;
  if ((row as any).callStatus === 'Contestó') score += 14;
  if (row.numeroJuicio) score -= 35;
  if (row.callStatus === 'Número inválido') score -= 25;
  if ((row as any).whatsappStatus === 'Sin respuesta') score -= 10;
  if (row.diasMora > 180) score -= 20;
  else if (row.diasMora > 90) score -= 10;
  else if (row.diasMora <= 30) score += 8;

  return Math.max(1, Math.min(99, score));
}

function getBestChannel(row: DashboardRow): 'WhatsApp' | 'Llamada' | 'Mixto' | 'Jurídico' {
  if (row.numeroJuicio || row.diasMora >= 180) return 'Jurídico';
  if ((row as any).whatsappStatus === 'Respondió' && (row as any).callStatus === 'Contestó') return 'Mixto';
  if ((row as any).whatsappStatus === 'Respondió' || row.telefono.startsWith('09')) return 'WhatsApp';
  return 'Llamada';
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function scoreColor(score: number) {
  if (score >= 75) return COLORS.green;
  if (score >= 50) return COLORS.orange;
  return COLORS.red;
}

function tagColor(value: string) {
  const t = value.toLowerCase();
  if (t.includes('crítico') || t.includes('critico')) return { bg: '#fee2e2', color: '#b91c1c' };
  if (t.includes('muy urgente')) return { bg: '#ffedd5', color: '#c2410c' };
  if (t.includes('urgente')) return { bg: '#fef3c7', color: '#b45309' };
  if (t.includes('prioritario')) return { bg: '#dbeafe', color: '#1d4ed8' };
  if (t.includes('normal')) return { bg: '#dcfce7', color: '#15803d' };
  if (t.includes('respond')) return { bg: '#dcfce7', color: '#15803d' };
  if (t.includes('sin respuesta')) return { bg: '#fee2e2', color: '#b91c1c' };
  if (t.includes('contestó')) return { bg: '#dcfce7', color: '#15803d' };
  if (t.includes('no contestó')) return { bg: '#fef3c7', color: '#92400e' };
  return { bg: '#e2e8f0', color: '#334155' };
}

function KpiCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: 18,
        boxShadow: '0 18px 40px rgba(2,8,23,0.28)',
        minHeight: 120,
      }}
    >
      <div
        style={{
          width: 42,
          height: 6,
          borderRadius: 999,
          background: accent,
          marginBottom: 14,
        }}
      />
      <div style={{ color: COLORS.textSoft, fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div style={{ color: COLORS.text, fontSize: 28, fontWeight: 900, lineHeight: 1.1 }}>{value}</div>
      {subtitle ? <div style={{ color: COLORS.textSoft, fontSize: 12, marginTop: 10 }}>{subtitle}</div> : null}
    </div>
  );
}

function InsightCard({
  title,
  value,
  detail,
  color,
}: {
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        padding: 18,
        boxShadow: '0 14px 40px rgba(15,23,42,0.08)',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: color,
          opacity: 0.16,
          marginBottom: 14,
        }}
      />
      <div style={{ fontSize: 13, fontWeight: 800, color: '#64748b', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{detail}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  useEffect(() => {
  const loadData = async () => {
    try {
      const res = await fetch('http://192.168.4.42:3001/cobranzas/current');
      const data = await res.json();

      console.log('DATA BACKEND:', data);

      if (data && data.rows) {
        setRows(data.rows);
      } else {
        setRows([]);
      }

      setLoaded(true);
    } catch (error) {
      console.error('ERROR CARGANDO:', error);
      setRows([]);
      setLoaded(true);
    }
  };

  loadData();
}, []);
  const enrichedRows = useMemo<EnrichedRow[]>(() => {
    return rows.map((row) => {
      const score = getScore(row);
      return {
        ...row,
        sentiment: getSentiment(row),
        recommendation: getIARecommendation(row),
        score,
        probabilidad: score,
        mejorCanal: getBestChannel(row),
      };
    });
  }, [rows]);

  useEffect(() => {
    if (!selectedClientId && enrichedRows.length > 0) {
      setSelectedClientId(enrichedRows[0].id);
    }
  }, [selectedClientId, enrichedRows]);

  const selectedClient =
    enrichedRows.find((row) => row.id === selectedClientId) || enrichedRows[0] || null;

  const totalCartera = useMemo(
    () => enrichedRows.reduce((acc, row) => acc + parseNumberish(row.monto), 0),
    [enrichedRows]
  );

  const totalPromesas = useMemo(
    () => enrichedRows.filter((r) => r.promesa !== '-' && r.promesa !== '').length,
    [enrichedRows]
  );

  const totalContactados = useMemo(
    () =>
      enrichedRows.filter(
        (r) => r.callStatus === 'Contestó' || r.whatsappStatus === 'Respondió'
      ).length,
    [enrichedRows]
  );

  const totalInvalidos = useMemo(
    () => enrichedRows.filter((r) => r.callStatus === 'Número inválido').length,
    [enrichedRows]
  );

  const totalCriticos = useMemo(
    () => enrichedRows.filter((r) => r.bloque.toLowerCase().includes('crítico') || r.bloque.toLowerCase().includes('critico')).length,
    [enrichedRows]
  );

  const totalMuyUrgentes = useMemo(
    () => enrichedRows.filter((r) => r.bloque.toLowerCase().includes('muy urgente')).length,
    [enrichedRows]
  );

  const recuperacionProyectada = useMemo(() => {
    return enrichedRows.reduce((acc, row) => {
      if (row.numeroJuicio) return acc + row.monto * 0.02;
      if (row.promesa !== '-') return acc + row.monto * 0.22;
      if (row.whatsappStatus === 'Respondió' && row.callStatus === 'Contestó') return acc + row.monto * 0.14;
      if (row.whatsappStatus === 'Respondió') return acc + row.monto * 0.12;
      if (row.callStatus === 'Contestó') return acc + row.monto * 0.09;
      return acc + row.monto * 0.02;
    }, 0);
  }, [enrichedRows]);

  const porcentajeRecuperacion = useMemo(() => {
    if (!totalCartera) return 0;
    return Math.round((recuperacionProyectada / totalCartera) * 100);
  }, [recuperacionProyectada, totalCartera]);

  const clientesCalientes = useMemo(
    () => enrichedRows.filter((r) => r.score >= 75).length,
    [enrichedRows]
  );

  const clientesEnRiesgo = useMemo(
    () => enrichedRows.filter((r) => r.score < 45).length,
    [enrichedRows]
  );

  const contactoEfectivoPct = useMemo(() => {
    if (!enrichedRows.length) return 0;
    return Math.round((totalContactados / enrichedRows.length) * 100);
  }, [enrichedRows, totalContactados]);

  const whatsappEfectivoPct = useMemo(() => {
    if (!enrichedRows.length) return 0;
    const respondidos = enrichedRows.filter((r) => r.whatsappStatus === 'Respondió').length;
    return Math.round((respondidos / enrichedRows.length) * 100);
  }, [enrichedRows]);

  const campaignProjection = useMemo(() => {
    const universo = enrichedRows.filter((r) => r.mejorCanal !== 'Jurídico').length;
    const enviados = Math.round(universo * 0.86);
    const respuestas = Math.round(enviados * 0.24);
    const promesas = Math.round(respuestas * 0.32);
    const pagos = Math.round(promesas * 0.58);
    const monto = enrichedRows
      .filter((r) => r.score >= 60)
      .slice(0, Math.max(1, pagos))
      .reduce((acc, r) => acc + r.monto * 0.38, 0);

    return { enviados, respuestas, promesas, pagos, monto };
  }, [enrichedRows]);

  const priorityData = useMemo(() => {
    const order = ['Crítico', 'Muy urgente', 'Urgente', 'Prioritario', 'Normal'];
    const map = new Map<string, number>();
    enrichedRows.forEach((r) => map.set(r.bloque, (map.get(r.bloque) || 0) + 1));

    return order
      .map((name) => ({ name, value: map.get(name) || 0 }))
      .filter((item) => item.value > 0);
  }, [enrichedRows]);

  const sentimentData = useMemo(() => {
    const counts = { Positivo: 0, Neutral: 0, Negativo: 0 };
    enrichedRows.forEach((r) => {
      counts[r.sentiment] += 1;
    });
    return [
      { name: 'Positivo', value: counts.Positivo },
      { name: 'Neutral', value: counts.Neutral },
      { name: 'Negativo', value: counts.Negativo },
    ];
  }, [enrichedRows]);

  const channelData = useMemo(() => {
    return [
      {
        name: 'WhatsApp',
        respondidos: enrichedRows.filter((r) => r.whatsappStatus === 'Respondió').length,
        sinRespuesta: enrichedRows.filter((r) => r.whatsappStatus === 'Sin respuesta').length,
      },
      {
        name: 'Llamadas',
        respondidos: enrichedRows.filter((r) => r.callStatus === 'Contestó').length,
        sinRespuesta: enrichedRows.filter((r) => r.callStatus === 'No contestó').length,
      },
    ];
  }, [enrichedRows]);

  const moraData = useMemo(() => {
    const ranges = [
      { name: '0-30', value: 0 },
      { name: '31-60', value: 0 },
      { name: '61-90', value: 0 },
      { name: '91-180', value: 0 },
      { name: '180+', value: 0 },
    ];

    enrichedRows.forEach((r) => {
      if (r.diasMora <= 30) ranges[0].value += 1;
      else if (r.diasMora <= 60) ranges[1].value += 1;
      else if (r.diasMora <= 90) ranges[2].value += 1;
      else if (r.diasMora <= 180) ranges[3].value += 1;
      else ranges[4].value += 1;
    });

    return ranges;
  }, [enrichedRows]);

  const executiveFlowData = useMemo(() => {
    return [
      { etapa: 'Base activa', valor: enrichedRows.length || 0 },
      { etapa: 'Contactables', valor: enrichedRows.filter((r) => r.callStatus !== 'Número inválido').length },
      { etapa: 'Interacción', valor: totalContactados },
      { etapa: 'Promesas', valor: totalPromesas },
      { etapa: 'Pago proyectado', valor: campaignProjection.pagos },
    ];
  }, [campaignProjection.pagos, enrichedRows, totalContactados, totalPromesas]);

  const topClients = useMemo(() => {
    return [...enrichedRows]
      .sort((a, b) => b.score - a.score || b.monto - a.monto)
      .slice(0, 8);
  }, [enrichedRows]);

  const iaSummary = useMemo(() => {
    return {
      recuperables: enrichedRows.filter((r) => r.recommendation === 'Alta probabilidad de recuperación').length,
      depurar: enrichedRows.filter((r) => r.recommendation === 'Depurar base').length,
      juridico: enrichedRows.filter((r) => r.recommendation === 'Sugerido jurídico').length,
      seguimiento: enrichedRows.filter((r) => r.recommendation === 'Seguimiento comercial').length,
      reintento: enrichedRows.filter((r) => r.recommendation === 'Reintento intensivo').length,
    };
  }, [enrichedRows]);

  if (!loaded) {
    return <div style={{ padding: 24 }}>Cargando dashboard...</div>;
  }

  if (!rows.length) {
    return (
      <div style={{ padding: 24, minHeight: '100vh', background: COLORS.bg, color: COLORS.text }}>
        <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 12 }}>Dashboard Ejecutivo IA</div>
        <div style={{ color: COLORS.textSoft, fontSize: 16 }}>
          No hay datos cargados todavía. Ve a cobranzas, carga el Excel y vuelve aquí.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <div style={styles.heroEyebrow}>DISCOVERY INNOVA · COBRANZAS INTELIGENTES</div>
          <h1 style={styles.heroTitle}>Panel ejecutivo de recuperación con IA comercial</h1>
          <p style={styles.heroText}>
            Vista premium para presentación: recuperación proyectada, lectura de riesgo,
            clientes prioritarios, simulación de campaña y ficha inteligente por cliente.
          </p>
        </div>

        <div style={styles.heroBadgeWrap}>
          <div style={styles.heroBadge}>
            <div style={styles.heroBadgeLabel}>Recuperación potencial</div>
            <div style={styles.heroBadgeValue}>{formatMoney(recuperacionProyectada)}</div>
            <div style={styles.heroBadgeSub}>Escenario simulado sobre la base cargada</div>
          </div>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <KpiCard
          title="Cartera total"
          value={formatMoney(totalCartera)}
          subtitle={`${rows.length} clientes en la base activa`}
          accent={COLORS.cyan}
        />
        <KpiCard
          title="Recuperación proyectada"
          value={formatMoney(recuperacionProyectada)}
          subtitle={`${porcentajeRecuperacion}% del total de cartera`}
          accent={COLORS.green}
        />
        <KpiCard
          title="Clientes calientes"
          value={String(clientesCalientes)}
          subtitle="Probabilidad alta de contacto o pago"
          accent={COLORS.orange}
        />
        <KpiCard
          title="Clientes en riesgo"
          value={String(clientesEnRiesgo)}
          subtitle="Base que requiere acción intensiva"
          accent={COLORS.red}
        />
        <KpiCard
          title="Contactabilidad"
          value={`${contactoEfectivoPct}%`}
          subtitle={`${totalContactados} clientes con interacción`}
          accent={COLORS.blue}
        />
        <KpiCard
          title="WhatsApp efectivo"
          value={`${whatsappEfectivoPct}%`}
          subtitle="Tasa estimada de respuesta"
          accent={COLORS.purple}
        />
      </div>

      <div style={styles.insightGrid}>
        <InsightCard
          title="Lectura IA"
          value={`${iaSummary.recuperables}`}
          detail="Clientes con alta probabilidad de recuperación inmediata."
          color={COLORS.green}
        />
        <InsightCard
          title="Casos críticos"
          value={`${totalCriticos}`}
          detail="Segmento que debe activarse con prioridad máxima."
          color={COLORS.red}
        />
        <InsightCard
          title="Muy urgentes"
          value={`${totalMuyUrgentes}`}
          detail="Casos con ventana corta para gestión efectiva."
          color={COLORS.orange}
        />
        <InsightCard
          title="Números inválidos"
          value={`${totalInvalidos}`}
          detail="Base que requiere depuración operativa."
          color={COLORS.pink}
        />
      </div>

      <div style={styles.gridTop}>
        <div style={styles.darkCard}>
          <div style={styles.sectionLabel}>SIMULACIÓN COMERCIAL</div>
          <div style={styles.sectionTitleLight}>Impacto proyectado de campaña omnicanal</div>

          <div style={styles.simGrid}>
            <div style={styles.simBox}>
              <div style={styles.simValue}>{campaignProjection.enviados}</div>
              <div style={styles.simLabel}>WhatsApp enviados</div>
            </div>
            <div style={styles.simBox}>
              <div style={styles.simValue}>{campaignProjection.respuestas}</div>
              <div style={styles.simLabel}>Respuestas esperadas</div>
            </div>
            <div style={styles.simBox}>
              <div style={styles.simValue}>{campaignProjection.promesas}</div>
              <div style={styles.simLabel}>Promesas proyectadas</div>
            </div>
            <div style={styles.simBox}>
              <div style={styles.simValue}>{campaignProjection.pagos}</div>
              <div style={styles.simLabel}>Pagos estimados</div>
            </div>
          </div>

          <div style={styles.simRevenue}>
            <span style={styles.simRevenueLabel}>Ingreso estimado de campaña:</span>
            <span style={styles.simRevenueValue}>{formatMoney(campaignProjection.monto)}</span>
          </div>

          <div style={styles.scriptPanel}>
            <div style={styles.scriptTitle}>Recomendación ejecutiva</div>
            <div style={styles.scriptText}>
              Activar primero el bloque crítico y muy urgente con secuencia WhatsApp + llamada,
              concentrando a los gestores en clientes con score mayor a 75 y mora menor a 180 días.
            </div>
          </div>
        </div>

        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Cliente inteligente</div>

          {selectedClient ? (
            <>
              <div style={styles.clientHeader}>
                <div>
                  <div style={styles.clientName}>{selectedClient.nombre}</div>
                  <div style={styles.clientSub}>
                    {selectedClient.ciudad} · {selectedClient.telefono || 'Sin teléfono'} · {selectedClient.gestor}
                  </div>
                </div>

                <div
                  style={{
                    ...styles.scoreBadge,
                    background: scoreColor(selectedClient.score),
                  }}
                >
                  {selectedClient.score}
                </div>
              </div>

              <div style={styles.clientGrid}>
                <MiniData title="Monto" value={formatMoney(selectedClient.monto)} />
                <MiniData title="Días mora" value={String(selectedClient.diasMora)} />
                <MiniData title="Mejor canal" value={selectedClient.mejorCanal} />
                <MiniData title="Bloque" value={selectedClient.bloque} />
              </div>

              <div style={styles.clientAdvice}>
                <div style={styles.clientAdviceTitle}>Análisis IA</div>
                <div style={styles.clientAdviceText}>
                  Probabilidad estimada de recuperación: <strong>{selectedClient.probabilidad}%</strong>. Recomendación:
                  <strong> {selectedClient.recommendation}</strong>. Acción sugerida:
                  <strong> {selectedClient.proximaAccion !== '-' ? selectedClient.proximaAccion : `contacto por ${selectedClient.mejorCanal}`}</strong>.
                </div>
              </div>

              <div style={styles.clientButtons}>
                {topClients.slice(0, 4).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    style={{
                      ...styles.clientSelectBtn,
                      borderColor: client.id === selectedClient.id ? '#0f172a' : '#cbd5e1',
                      background: client.id === selectedClient.id ? '#eff6ff' : '#fff',
                    }}
                  >
                    {client.nombre.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Bloques de prioridad</div>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {priorityData.map((item, index) => {
                  const palette = [COLORS.red, COLORS.orange, '#fbbf24', COLORS.blue, COLORS.green];
                  return <Cell key={`${item.name}-${index}`} fill={palette[index % palette.length]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Sentimiento IA</div>
          <ResponsiveContainer width="100%" height={290}>
            <PieChart>
              <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={92} label>
                <Cell fill={COLORS.green} />
                <Cell fill={COLORS.orange} />
                <Cell fill={COLORS.red} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Omnicanal: WhatsApp vs llamadas</div>
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={channelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="respondidos" fill={COLORS.green} radius={[8, 8, 0, 0]} />
              <Bar dataKey="sinRespuesta" fill={COLORS.orange} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Rangos de mora</div>
          <ResponsiveContainer width="100%" height={290}>
            <LineChart data={moraData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={4} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Embudo ejecutivo de gestión</div>
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={executiveFlowData}>
              <defs>
                <linearGradient id="flowColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="etapa" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="valor" stroke={COLORS.cyan} fillOpacity={1} fill="url(#flowColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.whiteCard}>
          <div style={styles.sectionTitleDark}>Resumen IA</div>
          <div style={styles.summaryList}>
            <SummaryItem label="Alta probabilidad de recuperación" value={iaSummary.recuperables} />
            <SummaryItem label="Depurar base" value={iaSummary.depurar} />
            <SummaryItem label="Seguimiento comercial" value={iaSummary.seguimiento} />
            <SummaryItem label="Sugeridos a jurídico" value={iaSummary.juridico} />
            <SummaryItem label="Reintento intensivo" value={iaSummary.reintento} />
            <SummaryItem label="Promesas activas" value={totalPromesas} />
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.sectionTitleDark}>Radar de clientes priorizados</div>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Monto</th>
                <th style={styles.th}>Bloque</th>
                <th style={styles.th}>WhatsApp</th>
                <th style={styles.th}>Llamada</th>
                <th style={styles.th}>Score IA</th>
                <th style={styles.th}>Recomendación</th>
              </tr>
            </thead>
            <tbody>
              {topClients.map((row) => {
                const bloqueTag = tagColor(row.bloque);
                const whatsappTag = tagColor(row.whatsappStatus);
                const callTag = tagColor(row.callStatus);

                return (
                  <tr
                    key={row.id}
                    style={{
                      background: selectedClientId === row.id ? '#f8fafc' : '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedClientId(row.id)}
                  >
                    <td style={styles.td}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{row.nombre}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{row.ciudad} · {row.gestor}</div>
                    </td>
                    <td style={styles.td}>{formatMoney(row.monto)}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.tag, background: bloqueTag.bg, color: bloqueTag.color }}>
                        {row.bloque}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.tag, background: whatsappTag.bg, color: whatsappTag.color }}>
                        {row.whatsappStatus}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.tag, background: callTag.bg, color: callTag.color }}>
                        {row.callStatus}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div
                        style={{
                          ...styles.scorePill,
                          background: scoreColor(row.score),
                        }}
                      >
                        {row.score}
                      </div>
                    </td>
                    <td style={styles.td}>{row.recommendation}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniData({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.miniData}>
      <div style={styles.miniTitle}>{title}</div>
      <div style={styles.miniValue}>{value}</div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.summaryItem}>
      <span style={styles.summaryLabel}>{label}</span>
      <span style={styles.summaryValue}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at top left, rgba(6,182,212,0.18), transparent 24%), radial-gradient(circle at top right, rgba(139,92,246,0.16), transparent 22%), linear-gradient(180deg, #081225 0%, #0d1830 100%)',
    padding: 20,
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 0.9fr',
    gap: 18,
    marginBottom: 18,
    alignItems: 'stretch',
  },
  heroEyebrow: {
    color: '#67e8f9',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 40,
    lineHeight: 1.05,
    fontWeight: 900,
    margin: 0,
    marginBottom: 12,
    maxWidth: 780,
  },
  heroText: {
    color: '#9fb3d9',
    fontSize: 16,
    lineHeight: 1.65,
    maxWidth: 760,
    margin: 0,
  },
  heroBadgeWrap: {
    display: 'flex',
    alignItems: 'stretch',
  },
  heroBadge: {
    width: '100%',
    borderRadius: 24,
    padding: 22,
    background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(59,130,246,0.14))',
    border: `1px solid ${COLORS.border}`,
    boxShadow: '0 18px 40px rgba(2,8,23,0.28)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  heroBadgeLabel: {
    color: COLORS.textSoft,
    fontWeight: 700,
    fontSize: 13,
    marginBottom: 10,
  },
  heroBadgeValue: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 34,
    lineHeight: 1.1,
    marginBottom: 8,
  },
  heroBadgeSub: {
    color: '#c7d2fe',
    fontSize: 13,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 14,
    marginBottom: 18,
  },
  insightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    marginBottom: 18,
  },
  gridTop: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: 14,
    marginBottom: 18,
  },
  darkCard: {
    background: 'linear-gradient(180deg, #0e1c37 0%, #0a1630 100%)',
    borderRadius: 24,
    padding: 20,
    border: `1px solid ${COLORS.border}`,
    boxShadow: '0 18px 40px rgba(2,8,23,0.28)',
  },
  whiteCard: {
    background: '#fff',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
    border: '1px solid #e2e8f0',
  },
  tableCard: {
    background: '#fff',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
    border: '1px solid #e2e8f0',
    marginBottom: 10,
  },
  sectionLabel: {
    color: '#67e8f9',
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionTitleLight: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 28,
    marginBottom: 18,
  },
  sectionTitleDark: {
    color: '#0f172a',
    fontWeight: 900,
    fontSize: 24,
    marginBottom: 16,
  },
  simGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 18,
  },
  simBox: {
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
  },
  simValue: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 28,
    marginBottom: 8,
  },
  simLabel: {
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: 700,
  },
  simRevenue: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderRadius: 18,
    background: 'rgba(16,185,129,0.12)',
    marginBottom: 16,
  },
  simRevenueLabel: {
    color: '#d1fae5',
    fontWeight: 700,
  },
  simRevenueValue: {
    color: '#fff',
    fontWeight: 900,
    fontSize: 24,
  },
  scriptPanel: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    border: `1px solid ${COLORS.border}`,
  },
  scriptTitle: {
    color: '#fff',
    fontWeight: 800,
    marginBottom: 10,
  },
  scriptText: {
    color: COLORS.textSoft,
    lineHeight: 1.6,
    fontSize: 14,
  },
  clientHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 900,
    color: '#0f172a',
    marginBottom: 6,
  },
  clientSub: {
    color: '#64748b',
    fontSize: 13,
  },
  scoreBadge: {
    minWidth: 68,
    height: 68,
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 900,
    fontSize: 24,
    boxShadow: '0 10px 30px rgba(15,23,42,0.16)',
  },
  clientGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 14,
  },
  miniData: {
    background: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    border: '1px solid #e2e8f0',
  },
  miniTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 800,
    marginBottom: 6,
  },
  miniValue: {
    color: '#0f172a',
    fontWeight: 900,
    fontSize: 18,
  },
  clientAdvice: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  clientAdviceTitle: {
    color: '#1d4ed8',
    fontWeight: 900,
    marginBottom: 8,
  },
  clientAdviceText: {
    color: '#1e3a8a',
    lineHeight: 1.6,
    fontSize: 14,
  },
  clientButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
  },
  clientSelectBtn: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    borderRadius: 999,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 18,
  },
  summaryList: {
    display: 'grid',
    gap: 12,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    borderRadius: 16,
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
  },
  summaryLabel: {
    color: '#334155',
    fontWeight: 700,
  },
  summaryValue: {
    color: '#0f172a',
    fontWeight: 900,
    fontSize: 18,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px 10px',
    fontSize: 12,
    color: '#64748b',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  td: {
    padding: '14px 10px',
    borderBottom: '1px solid #eef2f7',
    fontSize: 14,
    color: '#334155',
    verticalAlign: 'middle',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  scorePill: {
    display: 'inline-flex',
    minWidth: 44,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 900,
    padding: '0 10px',
  },
};

export {};