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

const STORAGE_KEYS = [
  'crm_cobranzas_rows_v10', // 🔥 CLAVE REAL CORRECTA
  'crm_cobranzas_rows',
  'crm_cobranzas_data',
  'crmCobranzasRows',
  'cobranzasRows',
  'uploadedCobranzasRows',
];

function getString(row: RowLike, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function getNumber(row: RowLike, keys: string[]) {
  for (const key of keys) {
    const raw = row[key];
    if (raw === undefined || raw === null || raw === '') continue;

    const parsed = Number(
      String(raw)
        .replace(/\$/g, '')
        .replace(/\s/g, '')
        .replace(/\./g, '')
        .replace(',', '.')
    );

    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function normalizeRow(row: RowLike, index: number): DashboardRow {
  return {
    id: getString(row, ['id', 'ID']) || `row-${index}`,
    nombre: getString(row, ['nombre', 'Nombre', 'cliente', 'Cliente']),
    telefono: getString(row, ['telefono', 'Teléfono', 'telefono1', 'Telefono']),
    ciudad: getString(row, ['ciudad', 'Ciudad']),
    parroquia: getString(row, ['parroquia', 'Parroquia']),
    diasMora: getNumber(row, ['diasMora', 'DiasMora', 'dias_mora', 'dias mora', 'Días mora']),
    monto: getNumber(row, ['monto', 'Monto', 'obligacionVencida', 'Obligación vencida', 'Obligacion vencida']),
    garantia: getString(row, ['garantia', 'Garantía', 'Garantia']),
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
  const w = row.whatsappStatus.toLowerCase();
  const c = row.callStatus.toLowerCase();

  if (
    w.includes('respond') ||
    c.includes('contest') ||
    row.promesa !== '-' ||
    row.proximaAccion.toLowerCase().includes('seguimiento')
  ) {
    return 'Positivo';
  }

  if (
    c.includes('número inválido') ||
    c.includes('numero invalido') ||
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}
function parseMoney(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const text = String(value).trim();
  if (!text) return 0;

  const normalized = text
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
export default function DashboardPage() {
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadedRows = loadRowsFromStorage();
    setRows(loadedRows);
    setLoaded(true);
  }, []);

  const enrichedRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      sentiment: getSentiment(row),
      recommendation: getIARecommendation(row),
    }));
  }, [rows]);

  const totalCartera = useMemo(
    () => enrichedRows.reduce((acc, row) => acc + parseMoney(row.monto), 0),
    [enrichedRows]
  );

  const totalContactados = useMemo(
    () => enrichedRows.filter((r) => r.callStatus === 'Contestó').length,
    [enrichedRows]
  );

  const totalNoContactados = useMemo(
    () =>
      enrichedRows.filter(
        (r) => r.callStatus === 'No contestó' || r.callStatus === 'Sin llamar'
      ).length,
    [enrichedRows]
  );

  const totalInvalidos = useMemo(
    () => enrichedRows.filter((r) => r.callStatus === 'Número inválido').length,
    [enrichedRows]
  );

  const totalPromesas = useMemo(
    () => enrichedRows.filter((r) => r.promesa !== '-' && r.promesa !== '').length,
    [enrichedRows]
  );

  const totalJuicio = useMemo(
    () =>
      enrichedRows.filter(
        (r) => r.numeroJuicio || r.recommendation === 'Sugerido jurídico'
      ).length,
    [enrichedRows]
  );

  const totalRecuperacionSimulada = useMemo(() => {
    return enrichedRows.reduce((acc, row) => {
     if (row.promesa !== '-') return acc + parseMoney(row.monto) * 0.18;
      if (row.whatsAppStatus === 'Respondió') return acc + parseMoney(row.monto) * 0.1;
      if (row.callStatus === 'Contestó') return acc + parseMoney(row.monto) * 0.07;
      return acc;
    }, 0);
  }, [enrichedRows]);

  const porcentajeRecuperacion = useMemo(() => {
    if (!totalCartera) return 0;
    return Math.round((totalRecuperacionSimulada / totalCartera) * 100);
  }, [totalCartera, totalRecuperacionSimulada]);

  const bloqueData = useMemo(() => {
    const map = new Map<string, number>();
    enrichedRows.forEach((r) => {
      map.set(r.bloque, (map.get(r.bloque) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
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

  const canalData = useMemo(() => {
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

  const iaSummary = useMemo(() => {
    return {
      recuperables: enrichedRows.filter((r) => r.recommendation === 'Alta probabilidad de recuperación').length,
      depurar: enrichedRows.filter((r) => r.recommendation === 'Depurar base').length,
      juridico: enrichedRows.filter((r) => r.recommendation === 'Sugerido jurídico').length,
      seguimiento: enrichedRows.filter((r) => r.recommendation === 'Seguimiento comercial').length,
    };
  }, [enrichedRows]);

  if (!loaded) {
    return <div style={{ padding: 24 }}>Cargando dashboard...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.topTabs}>
        <button style={styles.tabActive}>Dashboard</button>
        <button style={styles.tab}>Usuarios</button>
      </div>

      <h1 style={styles.title}>Dashboard IA de Cobranzas</h1>

      <div style={styles.kpiGrid}>
        <KpiCard title="Cartera total" value={formatMoney(totalCartera)} />
        <KpiCard title="Recuperación simulada" value={formatMoney(totalRecuperacionSimulada)} />
        <KpiCard title="% recuperación" value={`${porcentajeRecuperacion}%`} />
        <KpiCard title="Contactados" value={String(totalContactados)} />
        <KpiCard title="Promesas" value={String(totalPromesas)} />
        <KpiCard title="Casos a juicio" value={String(totalJuicio)} />
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.cardLarge}>
          <div style={styles.cardTitle}>Bloques de prioridad</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={bloqueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.cardSmall}>
          <div style={styles.cardTitle}>Sentimiento IA</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sentimentData}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label
              >
                {sentimentData.map((_, index) => (
                  <Cell key={index} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.chartGrid}>
        <div style={styles.cardLarge}>
          <div style={styles.cardTitle}>WhatsApp vs llamadas</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={canalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="respondidos" radius={[8, 8, 0, 0]} />
              <Bar dataKey="sinRespuesta" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.cardSmall}>
          <div style={styles.cardTitle}>Rangos de mora</div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={moraData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.cardLarge}>
          <div style={styles.cardTitle}>Resumen IA</div>
          <div style={styles.iaList}>
            <div style={styles.iaItem}>Alta probabilidad de recuperación: <strong>{iaSummary.recuperables}</strong></div>
            <div style={styles.iaItem}>Depurar base: <strong>{iaSummary.depurar}</strong></div>
            <div style={styles.iaItem}>Seguimiento comercial: <strong>{iaSummary.seguimiento}</strong></div>
            <div style={styles.iaItem}>Sugeridos jurídico: <strong>{iaSummary.juridico}</strong></div>
            <div style={styles.iaItem}>No contactados: <strong>{totalNoContactados}</strong></div>
            <div style={styles.iaItem}>Números inválidos: <strong>{totalInvalidos}</strong></div>
          </div>
        </div>

        <div style={styles.cardSmall}>
          <div style={styles.cardTitle}>Estado</div>
          <p style={styles.statusText}>
            Dashboard alimentado desde la base cargada en cobranzas, con simulación de
            recuperación, contacto, sentimiento y recomendación IA.
          </p>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: 18,
    background: '#edf2f7',
    minHeight: '100vh',
  },
  topTabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 18,
    background: '#fff',
    padding: 12,
    borderRadius: 12,
  },
  tab: {
    border: 'none',
    background: '#f1f5f9',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  tabActive: {
    border: 'none',
    background: '#0f172a',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 700,
  },
  title: {
    fontSize: 34,
    fontWeight: 900,
    color: '#0f172a',
    margin: '10px 0 18px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, 1fr)',
    gap: 12,
    marginBottom: 18,
  },
  kpiCard: {
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  },
  kpiTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 700,
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 900,
    color: '#0f172a',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 12,
    marginBottom: 18,
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: 12,
  },
  cardLarge: {
    background: '#fff',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  },
  cardSmall: {
    background: '#fff',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: '#0f172a',
    marginBottom: 12,
  },
  iaList: {
    display: 'grid',
    gap: 10,
  },
  iaItem: {
    background: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#334155',
  },
  statusText: {
    color: '#475569',
    lineHeight: 1.7,
    fontSize: 15,
  },
};