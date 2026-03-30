'use client';

import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';

type CobranzaRow = {
  id: string;
  cliente: string;
  documento: string;
  telefono: string;
  email: string;
  deuda: number;
  dias_mora: string;
  ciudad: string;
  parroquia: string;
  sector: string;
  direccion: string;
  gestor: string;
  whatsapp: string;
  estado_negociacion: string;
  proxima_gestion: string;
  compromiso_pago: string;
  recomendacion_legal: string;
  llamadas: number;
  respondio: string;
  garantia: string;
  observaciones: string;
};

type PriorityInfo = {
  bloque: string;
  prioridad: string;
  background: string;
  color: string;
};

function getPriorityInfo(diasMora: string): PriorityInfo {
  const dias = Number(diasMora) || 0;

  if (dias >= 120) {
    return {
      bloque: 'Bloque 1',
      prioridad: 'Crítico',
      background: '#7f1d1d',
      color: '#ffffff',
    };
  }

  if (dias >= 90) {
    return {
      bloque: 'Bloque 2',
      prioridad: 'Muy urgente',
      background: '#dc2626',
      color: '#ffffff',
    };
  }

  if (dias >= 60) {
    return {
      bloque: 'Bloque 3',
      prioridad: 'Urgente',
      background: '#f97316',
      color: '#ffffff',
    };
  }

  if (dias >= 30) {
    return {
      bloque: 'Bloque 4',
      prioridad: 'Prioritario',
      background: '#facc15',
      color: '#111827',
    };
  }

  if (dias >= 1) {
    return {
      bloque: 'Bloque 5',
      prioridad: 'Seguimiento',
      background: '#dbeafe',
      color: '#111827',
    };
  }

  return {
    bloque: 'Bloque 6',
    prioridad: 'Al día',
    background: '#dcfce7',
    color: '#166534',
  };
}

function formatMoney(value: number) {
  return value.toLocaleString('es-EC', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getWhatsappMessage(row: CobranzaRow) {
  const priority = getPriorityInfo(row.dias_mora);
  const deudaTexto = formatMoney(Number(row.deuda) || 0);

  if (priority.bloque === 'Bloque 1') {
    return `Estimado/a ${row.cliente}, registramos una obligación vencida por $${deudaTexto} con ${row.dias_mora} días de mora. Su caso ha sido clasificado como crítico. Por favor comuníquese hoy para regularizar su situación.`;
  }

  if (priority.bloque === 'Bloque 2') {
    return `Hola ${row.cliente}, su obligación pendiente registra $${deudaTexto} y ${row.dias_mora} días de mora. Es importante gestionar su pago a la brevedad para evitar un mayor escalamiento.`;
  }

  if (priority.bloque === 'Bloque 3') {
    return `Hola ${row.cliente}, le recordamos que mantiene un saldo pendiente de $${deudaTexto} con ${row.dias_mora} días de mora. Agradecemos tomar contacto para coordinar su regularización.`;
  }

  if (priority.bloque === 'Bloque 4') {
    return `Hola ${row.cliente}, registramos un valor pendiente de $${deudaTexto} con ${row.dias_mora} días de mora. Podemos ayudarle a ponerse al día.`;
  }

  if (priority.bloque === 'Bloque 5') {
    return `Hola ${row.cliente}, le compartimos un recordatorio preventivo de su obligación pendiente por $${deudaTexto}. Actualmente registra ${row.dias_mora} días de mora.`;
  }

  return `Hola ${row.cliente}, le saludamos cordialmente. Su registro se encuentra sin mora relevante. Estamos a disposición para cualquier consulta.`;
}

function isOverdue(dateValue: string) {
  if (!dateValue) return false;
  const today = new Date();
  const target = new Date(dateValue + 'T23:59:59');
  return target < today;
}

function todayPlusDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function simulateAIResponse(text: string, row: CobranzaRow) {
  const input = text.toLowerCase().trim();

  let estado_negociacion = row.estado_negociacion;
  let compromiso_pago = row.compromiso_pago;
  let proxima_gestion = row.proxima_gestion;
  let respondio = row.respondio;
  let recomendacion_legal = row.recomendacion_legal;
  let observaciones = row.observaciones;

  if (!input) {
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Sin cambios',
    };
  }

  if (
    input.includes('pago mañana') ||
    input.includes('pago maniana') ||
    input.includes('pago hoy') ||
    input.includes('voy a pagar') ||
    input.includes('cancelo mañana') ||
    input.includes('deposito mañana')
  ) {
    estado_negociacion = 'Promesa de pago';
    compromiso_pago = 'Alto';
    proxima_gestion = todayPlusDays(1);
    respondio = 'Respondió';
    observaciones = `IA simulada: cliente indica intención inmediata de pago. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Promesa de pago detectada',
    };
  }

  if (
    input.includes('viernes') ||
    input.includes('llámeme') ||
    input.includes('llameme') ||
    input.includes('la proxima semana') ||
    input.includes('la próxima semana') ||
    input.includes('despues') ||
    input.includes('después')
  ) {
    estado_negociacion = 'En negociación';
    compromiso_pago = 'Medio';
    proxima_gestion = todayPlusDays(3);
    respondio = 'Respondió';
    observaciones = `IA simulada: cliente solicita recontacto o diferimiento. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Seguimiento reagendado',
    };
  }

  if (
    input.includes('no tengo dinero') ||
    input.includes('sin dinero') ||
    input.includes('no puedo pagar') ||
    input.includes('estoy desempleado') ||
    input.includes('no tengo trabajo')
  ) {
    estado_negociacion = 'En negociación';
    compromiso_pago = 'Bajo';
    proxima_gestion = todayPlusDays(5);
    respondio = 'Respondió';
    observaciones = `IA simulada: cliente reporta incapacidad de pago. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Capacidad de pago baja detectada',
    };
  }

  if (
    input.includes('no responde') ||
    input.includes('sin respuesta') ||
    input.includes('no contestó') ||
    input.includes('no contesto') ||
    input.includes('buzón') ||
    input.includes('buzon')
  ) {
    estado_negociacion = 'Llamar';
    compromiso_pago = 'Sin compromiso';
    proxima_gestion = todayPlusDays(2);
    respondio = 'No respondió';
    observaciones = `IA simulada: intento sin contacto efectivo. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'No contacto detectado',
    };
  }

  if (
    input.includes('convenio') ||
    input.includes('acuerdo de pago') ||
    input.includes('cuotas') ||
    input.includes('refinanciar')
  ) {
    estado_negociacion = 'En negociación';
    compromiso_pago = 'Medio';
    proxima_gestion = todayPlusDays(2);
    respondio = 'Respondió';
    observaciones = `IA simulada: cliente solicita alternativa o convenio. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Solicitud de convenio detectada',
    };
  }

  if (
    input.includes('demanda') ||
    input.includes('abogado') ||
    input.includes('juicio') ||
    input.includes('no moleste')
  ) {
    estado_negociacion = 'Escalar a legal';
    compromiso_pago = 'Nulo';
    proxima_gestion = todayPlusDays(1);
    respondio = 'Respondió';
    recomendacion_legal = 'Evaluar demanda';
    observaciones = `IA simulada: lenguaje de conflicto o escalamiento legal. Texto detectado: "${text}"`;
    return {
      estado_negociacion,
      compromiso_pago,
      proxima_gestion,
      respondio,
      recomendacion_legal,
      observaciones,
      resumen: 'Escalamiento legal sugerido',
    };
  }

  estado_negociacion = 'Mensaje enviado';
  compromiso_pago = 'Sin compromiso';
  proxima_gestion = todayPlusDays(2);
  respondio = 'Respondió';
  observaciones = `IA simulada: respuesta recibida sin intención clara. Texto detectado: "${text}"`;

  return {
    estado_negociacion,
    compromiso_pago,
    proxima_gestion,
    respondio,
    recomendacion_legal,
    observaciones,
    resumen: 'Respuesta general detectada',
  };
}

export default function CobranzasPage() {
  const [rows, setRows] = useState<CobranzaRow[]>([]);
  const [selectedBlock, setSelectedBlock] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedRow, setCopiedRow] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [simulatedText, setSimulatedText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });

      const mappedRows: CobranzaRow[] = rawJson.map((item, index) => {
        const normalized: Record<string, unknown> = {};

        Object.keys(item).forEach((key) => {
          normalized[key.toLowerCase().trim()] = item[key];
        });

        const telefono = String(
          normalized.celularsms ??
            normalized.celulardeudor1 ??
            normalized.celular ??
            ''
        ).trim();

        const soloNumeros = telefono.replace(/\D/g, '');
        const whatsapp =
          soloNumeros.length >= 10 ? `593${soloNumeros.slice(-9)}` : '';

        const ciudad = String(normalized.ciudad ?? '').trim();
        const direccion = String(normalized.direccion ?? '').trim();

        return {
          id: String(
            normalized.identificacion ??
              normalized.cedula ??
              normalized.documento ??
              index
          ),
          cliente: String(normalized.cr_nombre ?? '').trim(),
          documento: String(
            normalized.identificacion ?? normalized.cedula ?? ''
          ).trim(),
          telefono,
          email: String(normalized.correo ?? normalized.email ?? '').trim(),
          deuda: Number(normalized.cr_saldo_cap ?? normalized.total_vencido ?? 0),
          dias_mora: String(normalized.cr_dias_a ?? '').trim(),
          ciudad,
          parroquia: '',
          sector: direccion,
          direccion,
          gestor: ciudad,
          whatsapp,
          estado_negociacion: 'Sin gestionar',
          proxima_gestion: '',
          compromiso_pago: 'Sin compromiso',
          recomendacion_legal:
            Number(normalized.cr_dias_a ?? 0) >= 120 ? 'Evaluar demanda' : 'No',
          llamadas: 0,
          respondio: 'No definido',
          garantia: '',
          observaciones: '',
        };
      });

      setRows(mappedRows);
      setSelectedBlock('Todos');
      setSelectedCity('Todas');
      setSearchTerm('');
      setCopiedRow(null);
      setSelectedRowId(mappedRows[0]?.id ?? null);
      setSimulatedText('');
      setAiSummary('');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleCopyMessage = async (row: CobranzaRow) => {
    const message = getWhatsappMessage(row);

    try {
      await navigator.clipboard.writeText(message);
      setCopiedRow(row.id);
      setTimeout(() => {
        setCopiedRow((current) => (current === row.id ? null : current));
      }, 2000);
    } catch (error) {
      console.error('No se pudo copiar el mensaje:', error);
    }
  };

  const updateRow = (id: string, field: keyof CobranzaRow, value: string | number) => {
    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const applySimulatedAI = () => {
    if (!selectedRowId) return;

    const currentRow = rows.find((row) => row.id === selectedRowId);
    if (!currentRow) return;

    const result = simulateAIResponse(simulatedText, currentRow);

    setRows((current) =>
      current.map((row) =>
        row.id === selectedRowId
          ? {
              ...row,
              estado_negociacion: result.estado_negociacion,
              compromiso_pago: result.compromiso_pago,
              proxima_gestion: result.proxima_gestion,
              respondio: result.respondio,
              recomendacion_legal: result.recomendacion_legal,
              observaciones: result.observaciones,
            }
          : row
      )
    );

    setAiSummary(result.resumen);
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const diasA = Number(a.dias_mora) || 0;
      const diasB = Number(b.dias_mora) || 0;
      return diasB - diasA;
    });
  }, [rows]);

  const cityOptions = useMemo(() => {
    const values = Array.from(
      new Set(sortedRows.map((row) => row.ciudad).filter(Boolean))
    ).sort();
    return ['Todas', ...values];
  }, [sortedRows]);

  const filteredRows = useMemo(() => {
    return sortedRows.filter((row) => {
      const priority = getPriorityInfo(row.dias_mora);
      const matchesBlock =
        selectedBlock === 'Todos' || priority.bloque === selectedBlock;

      const matchesCity =
        selectedCity === 'Todas' || row.ciudad === selectedCity;

      const search = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !search ||
        row.cliente.toLowerCase().includes(search) ||
        row.documento.toLowerCase().includes(search) ||
        row.telefono.toLowerCase().includes(search);

      return matchesBlock && matchesCity && matchesSearch;
    });
  }, [sortedRows, selectedBlock, selectedCity, searchTerm]);

  const selectedRow =
    filteredRows.find((row) => row.id === selectedRowId) ??
    sortedRows.find((row) => row.id === selectedRowId) ??
    null;

  const totalClientes = sortedRows.length;
  const totalCartera = sortedRows.reduce(
    (acc, row) => acc + (Number(row.deuda) || 0),
    0
  );

  const bloque1 = sortedRows.filter((row) => Number(row.dias_mora) >= 120);
  const bloque2 = sortedRows.filter((row) => {
    const dias = Number(row.dias_mora) || 0;
    return dias >= 90 && dias < 120;
  });
  const bloque3 = sortedRows.filter((row) => {
    const dias = Number(row.dias_mora) || 0;
    return dias >= 60 && dias < 90;
  });
  const montoCritico = bloque1.reduce(
    (acc, row) => acc + (Number(row.deuda) || 0),
    0
  );
  const alertasHoy = sortedRows.filter((row) => isOverdue(row.proxima_gestion)).length;

  const blockButtons = [
    {
      key: 'Todos',
      title: 'Todos',
      subtitle: `${sortedRows.length} registros`,
      bg: '#0f172a',
      color: '#ffffff',
    },
    {
      key: 'Bloque 1',
      title: 'Bloque 1',
      subtitle: `Crítico · ${bloque1.length}`,
      bg: '#7f1d1d',
      color: '#ffffff',
    },
    {
      key: 'Bloque 2',
      title: 'Bloque 2',
      subtitle: `Muy urgente · ${bloque2.length}`,
      bg: '#dc2626',
      color: '#ffffff',
    },
    {
      key: 'Bloque 3',
      title: 'Bloque 3',
      subtitle: `Urgente · ${bloque3.length}`,
      bg: '#f97316',
      color: '#ffffff',
    },
  ];

  return (
    <div
      style={{
        padding: '20px',
        height: '100vh',
        boxSizing: 'border-box',
        background: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>
        Cobranzas
      </h1>

      <p style={{ color: '#64748b', marginBottom: '16px' }}>
        Vista tipo CRM profesional con panel fijo y tabla independiente
      </p>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}
      >
        <button onClick={() => fileInputRef.current?.click()} style={darkButton}>
          Subir Excel de cobranzas
        </button>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={selectStyle}
        >
          {cityOptions.map((city) => (
            <option key={city}>{city}</option>
          ))}
        </select>

        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre, documento o teléfono"
          style={searchInput}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleExcelUpload}
        style={{ display: 'none' }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={kpiCard}>
          <div style={kpiLabel}>Total cartera</div>
          <div style={kpiValue}>${formatMoney(totalCartera)}</div>
        </div>

        <div style={kpiCard}>
          <div style={kpiLabel}>Total clientes</div>
          <div style={kpiValue}>{totalClientes}</div>
        </div>

        <div style={{ ...kpiCard, background: '#7f1d1d', color: '#fff' }}>
          <div style={{ ...kpiLabel, color: '#fecaca' }}>Críticos</div>
          <div style={kpiValue}>{bloque1.length}</div>
        </div>

        <div style={{ ...kpiCard, background: '#dc2626', color: '#fff' }}>
          <div style={{ ...kpiLabel, color: '#fecaca' }}>Muy urgentes</div>
          <div style={kpiValue}>{bloque2.length}</div>
        </div>

        <div style={{ ...kpiCard, background: '#f97316', color: '#fff' }}>
          <div style={{ ...kpiLabel, color: '#ffedd5' }}>Urgentes</div>
          <div style={kpiValue}>{bloque3.length}</div>
        </div>

        <div style={{ ...kpiCard, background: '#1d4ed8', color: '#fff' }}>
          <div style={{ ...kpiLabel, color: '#bfdbfe' }}>Alertas vencidas</div>
          <div style={kpiValue}>{alertasHoy}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        {blockButtons.map((item) => {
          const active = selectedBlock === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setSelectedBlock(item.key)}
              style={{
                background: item.bg,
                color: item.color,
                borderRadius: '12px',
                padding: '14px',
                border: active ? '3px solid #111827' : '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                {item.title}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.95 }}>{item.subtitle}</div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '400px 1fr',
          gap: '18px',
          height: 'calc(100vh - 285px)',
          minHeight: '420px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            padding: '18px',
            overflowY: 'auto',
            minHeight: 0,
          }}
        >
          {!selectedRow ? (
            <div style={{ color: '#64748b' }}>
              Selecciona un cliente en la tabla para ver y editar su ficha.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '22px', fontWeight: 700 }}>{selectedRow.cliente}</div>
                <div style={{ color: '#64748b', marginTop: '4px' }}>
                  {selectedRow.documento} · {selectedRow.ciudad}
                </div>
              </div>

              <div style={infoBox}>
                <div><strong>Deuda:</strong> ${formatMoney(Number(selectedRow.deuda) || 0)}</div>
                <div><strong>Días mora:</strong> {selectedRow.dias_mora}</div>
                <div><strong>Teléfono:</strong> {selectedRow.telefono || '-'}</div>
                <div><strong>Email:</strong> {selectedRow.email || '-'}</div>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>IA simulada: respuesta del cliente</label>
                <textarea
                  value={simulatedText}
                  onChange={(e) => setSimulatedText(e.target.value)}
                  style={textAreaStyle}
                  placeholder='Ejemplo: "pago mañana", "no tengo dinero", "llámeme el viernes", "quiero convenio", "no responde"'
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  <button onClick={applySimulatedAI} style={darkButton}>
                    Procesar con IA simulada
                  </button>
                  <button
                    onClick={() => {
                      setSimulatedText('');
                      setAiSummary('');
                    }}
                    style={softButton}
                  >
                    Limpiar
                  </button>
                </div>
                {aiSummary ? <div style={aiBadge}>IA simulada: {aiSummary}</div> : null}
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Parroquia</label>
                <input
                  value={selectedRow.parroquia}
                  onChange={(e) => updateRow(selectedRow.id, 'parroquia', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Sector</label>
                <input
                  value={selectedRow.sector}
                  onChange={(e) => updateRow(selectedRow.id, 'sector', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Dirección</label>
                <input
                  value={selectedRow.direccion}
                  onChange={(e) => updateRow(selectedRow.id, 'direccion', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Estado de negociación</label>
                <select
                  value={selectedRow.estado_negociacion}
                  onChange={(e) =>
                    updateRow(selectedRow.id, 'estado_negociacion', e.target.value)
                  }
                  style={inputStyle}
                >
                  <option>Sin gestionar</option>
                  <option>Llamar</option>
                  <option>Mensaje enviado</option>
                  <option>En negociación</option>
                  <option>Promesa de pago</option>
                  <option>No quiere pagar</option>
                  <option>Escalar a legal</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Próxima gestión</label>
                <input
                  type="date"
                  value={selectedRow.proxima_gestion}
                  onChange={(e) => updateRow(selectedRow.id, 'proxima_gestion', e.target.value)}
                  style={inputStyle}
                />
                <div style={{ marginTop: '6px' }}>
                  {isOverdue(selectedRow.proxima_gestion) ? (
                    <span style={alertBadge}>Alerta vencida</span>
                  ) : (
                    <span style={okBadge}>Sin alerta</span>
                  )}
                </div>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Compromiso de pago</label>
                <select
                  value={selectedRow.compromiso_pago}
                  onChange={(e) => updateRow(selectedRow.id, 'compromiso_pago', e.target.value)}
                  style={inputStyle}
                >
                  <option>Sin compromiso</option>
                  <option>Alto</option>
                  <option>Medio</option>
                  <option>Bajo</option>
                  <option>Nulo</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Recomendación legal</label>
                <select
                  value={selectedRow.recomendacion_legal}
                  onChange={(e) =>
                    updateRow(selectedRow.id, 'recomendacion_legal', e.target.value)
                  }
                  style={inputStyle}
                >
                  <option>No</option>
                  <option>Evaluar demanda</option>
                  <option>Prejurídico</option>
                  <option>Demanda inmediata</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Llamadas realizadas</label>
                <input
                  type="number"
                  min="0"
                  value={selectedRow.llamadas}
                  onChange={(e) =>
                    updateRow(selectedRow.id, 'llamadas', Number(e.target.value))
                  }
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Respondió</label>
                <select
                  value={selectedRow.respondio}
                  onChange={(e) => updateRow(selectedRow.id, 'respondio', e.target.value)}
                  style={inputStyle}
                >
                  <option>No definido</option>
                  <option>Respondió</option>
                  <option>No respondió</option>
                  <option>Teléfono apagado</option>
                  <option>Número errado</option>
                </select>
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Garantía</label>
                <input
                  value={selectedRow.garantia}
                  onChange={(e) => updateRow(selectedRow.id, 'garantia', e.target.value)}
                  style={inputStyle}
                  placeholder="Prenda, hipoteca, garante..."
                />
              </div>

              <div style={fieldGroup}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  value={selectedRow.observaciones}
                  onChange={(e) => updateRow(selectedRow.id, 'observaciones', e.target.value)}
                  style={textAreaStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {selectedRow.whatsapp ? (
                  <a
                    href={`https://wa.me/${selectedRow.whatsapp}?text=${encodeURIComponent(
                      getWhatsappMessage(selectedRow)
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={waButton}
                  >
                    WhatsApp
                  </a>
                ) : null}

                <button
                  onClick={() => handleCopyMessage(selectedRow)}
                  style={{
                    ...copyButton,
                    background: copiedRow === selectedRow.id ? '#2563eb' : '#e2e8f0',
                    color: copiedRow === selectedRow.id ? '#fff' : '#111827',
                  }}
                >
                  {copiedRow === selectedRow.id ? 'Copiado' : 'Copiar mensaje'}
                </button>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e5e7eb',
              fontWeight: 700,
              color: '#334155',
              background: '#ffffff',
            }}
          >
            Tabla de clientes · Registros visibles: {filteredRows.length}
          </div>

          <div
            style={{
              overflow: 'auto',
              minHeight: 0,
              flex: 1,
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th style={th}>Bloque</th>
                  <th style={th}>Prioridad</th>
                  <th style={th}>Cliente</th>
                  <th style={th}>Documento</th>
                  <th style={th}>Ciudad</th>
                  <th style={th}>Teléfono</th>
                  <th style={th}>Deuda</th>
                  <th style={th}>Días mora</th>
                  <th style={th}>Estado</th>
                  <th style={th}>Próxima gestión</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: '20px', textAlign: 'center' }}>
                      No hay registros para este filtro
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => {
                    const priority = getPriorityInfo(row.dias_mora);
                    const active = selectedRowId === row.id;

                    return (
                      <tr
                        key={index}
                        onClick={() => {
                          setSelectedRowId(row.id);
                          setSimulatedText('');
                          setAiSummary('');
                        }}
                        style={{
                          background: active ? '#dbeafe' : priority.background,
                          color: active ? '#111827' : priority.color,
                          cursor: 'pointer',
                        }}
                      >
                        <td style={td}>{priority.bloque}</td>
                        <td style={td}>{priority.prioridad}</td>
                        <td style={td}>{row.cliente}</td>
                        <td style={td}>{row.documento}</td>
                        <td style={td}>{row.ciudad}</td>
                        <td style={td}>{row.telefono}</td>
                        <td style={td}>${formatMoney(Number(row.deuda) || 0)}</td>
                        <td style={td}>{row.dias_mora}</td>
                        <td style={td}>{row.estado_negociacion}</td>
                        <td style={td}>
                          {row.proxima_gestion || '-'} {isOverdue(row.proxima_gestion) ? '⚠️' : ''}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const th = {
  textAlign: 'left' as const,
  padding: '12px',
  borderBottom: '1px solid #e5e7eb',
  background: '#f8fafc',
  color: '#111827',
  fontWeight: 700,
  fontSize: '14px',
  position: 'sticky' as const,
  top: 0,
  zIndex: 2,
};

const td = {
  padding: '12px',
  borderBottom: '1px solid rgba(0,0,0,0.06)',
  fontSize: '14px',
  verticalAlign: 'top' as const,
};

const kpiCard = {
  background: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
};

const kpiLabel = {
  fontSize: '13px',
  color: '#64748b',
  marginBottom: '8px',
};

const kpiValue = {
  fontSize: '24px',
  fontWeight: 700,
};

const darkButton = {
  padding: '10px 16px',
  borderRadius: '10px',
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontWeight: 600,
};

const softButton = {
  padding: '10px 16px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#111827',
  cursor: 'pointer',
  fontWeight: 600,
};

const selectStyle = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  minWidth: '180px',
};

const searchInput = {
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  minWidth: '280px',
};

const fieldGroup = {
  marginBottom: '12px',
};

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 700,
  marginBottom: '6px',
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#111827',
  fontSize: '14px',
};

const textAreaStyle = {
  width: '100%',
  minHeight: '90px',
  padding: '10px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#111827',
  fontSize: '14px',
  resize: 'vertical' as const,
};

const infoBox = {
  background: '#f8fafc',
  borderRadius: '12px',
  padding: '12px',
  marginBottom: '14px',
  color: '#334155',
  display: 'grid',
  gap: '6px',
};

const waButton = {
  display: 'inline-block',
  padding: '10px 12px',
  borderRadius: '10px',
  background: '#16a34a',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
  border: 'none',
};

const copyButton = {
  padding: '10px 12px',
  borderRadius: '10px',
  border: 'none',
  fontWeight: 600,
  cursor: 'pointer',
};

const alertBadge = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '999px',
  background: '#b91c1c',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 700,
};

const okBadge = {
  display: 'inline-block',
  padding: '4px 8px',
  borderRadius: '999px',
  background: '#166534',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 700,
};

const aiBadge = {
  marginTop: '10px',
  padding: '8px 10px',
  borderRadius: '10px',
  background: '#dbeafe',
  color: '#1e3a8a',
  fontSize: '13px',
  fontWeight: 700,
};