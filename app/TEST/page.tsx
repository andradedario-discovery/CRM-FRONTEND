'use client';

import { useEffect, useState } from 'react';

type Channel = 'WHATSAPP' | 'CALL';

type DemoClient = {
  nombre: string;
  telefono: string;
  ciudad: string;
  diasMora: number;
  monto: number;
  garantia: string;
  juicio: string;
  canal: Channel;
  accion: 'CALL_SCHEDULED' | 'FOLLOW_UP' | 'PRIORITY_CONTACT';
  titulo: string;
  decision: string;
  respuesta: string;
  fueraDeHorario: boolean;
};

type CallStep = {
  who: 'BOT' | 'CLIENTE' | 'SYSTEM';
  text: string;
};

function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function parseMoney(value: unknown): number {
  const raw = safeString(value);
  if (!raw) return 0;
  const clean = raw.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function parseIntSafe(value: unknown): number {
  const raw = safeString(value);
  if (!raw) return 0;
  const clean = raw.replace(/[^\d-]/g, '');
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
}

function normalizeKey(s: string): string {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function getField(row: Record<string, unknown>, candidates: string[]): unknown {
  const normalizedMap = new Map<string, unknown>();

  Object.keys(row || {}).forEach((key) => {
    normalizedMap.set(normalizeKey(key), row[key]);
  });

  for (const candidate of candidates) {
    const direct = row[candidate];
    if (direct !== null && direct !== undefined && safeString(direct) !== '') {
      return direct;
    }

    const normalized = normalizedMap.get(normalizeKey(candidate));
    if (normalized !== null && normalized !== undefined && safeString(normalized) !== '') {
      return normalized;
    }
  }

  return '';
}

function isOutsideBusinessHours(date = new Date()): boolean {
  const hour = date.getHours();
  return hour < 8 || hour >= 18;
}

function buildDecision(
  row: Omit<DemoClient, 'accion' | 'titulo' | 'decision' | 'respuesta' | 'fueraDeHorario'>
): DemoClient {
  const fueraDeHorario = isOutsideBusinessHours();

  if (fueraDeHorario) {
    const canalTexto = row.canal === 'CALL' ? 'llamada' : 'mensaje de WhatsApp';

    return {
      ...row,
      fueraDeHorario,
      accion: 'CALL_SCHEDULED',
      titulo:
        row.canal === 'CALL'
          ? 'Llamada entrante fuera de horario'
          : 'WhatsApp recibido fuera de horario',
      decision: `El sistema detectó una ${canalTexto} fuera del horario de atención. Se registra el contacto y se agenda devolución automática para primera hora hábil.`,
      respuesta:
        row.canal === 'CALL'
          ? 'Gracias por comunicarte con Discovery Innova. En este momento estamos fuera de horario. Hemos registrado tu llamada y un asesor te devolverá el contacto en la próxima franja de atención.'
          : 'Gracias por escribir a Discovery Innova. En este momento estamos fuera de horario. Hemos registrado tu mensaje y un asesor se comunicará contigo en la próxima franja de atención.',
    };
  }

  if (row.diasMora >= 90) {
    return {
      ...row,
      fueraDeHorario,
      accion: 'PRIORITY_CONTACT',
      titulo: 'Gestión prioritaria IA',
      decision:
        'El sistema detectó alta mora y monto relevante. Se prioriza contacto inmediato por parte del equipo para coordinar regularización.',
      respuesta: `Hola ${row.nombre}. Te contactamos por tu obligación vencida registrada por $${row.monto.toLocaleString(
        'en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )}. Nuestro equipo realizará gestión prioritaria hoy para coordinar una alternativa de regularización.`,
    };
  }

  if (row.diasMora >= 30) {
    return {
      ...row,
      fueraDeHorario,
      accion: 'FOLLOW_UP',
      titulo: 'Seguimiento automatizado IA',
      decision:
        'El sistema detectó mora intermedia. Se programa seguimiento automatizado y contacto del asesor.',
      respuesta: `Hola ${row.nombre}. Registramos una obligación vencida por $${row.monto.toLocaleString(
        'en-US',
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )}. Un asesor dará seguimiento para ayudarte con una alternativa de pago.`,
    };
  }

  return {
    ...row,
    fueraDeHorario,
    accion: 'FOLLOW_UP',
    titulo: 'Seguimiento IA',
    decision: 'El sistema registró el caso y sugiere seguimiento de rutina con el cliente.',
    respuesta: `Hola ${row.nombre}. Hemos registrado tu caso y un asesor se pondrá en contacto contigo para orientarte con el siguiente paso.`,
  };
}

function mapRowToClient(row: Record<string, unknown>): DemoClient {
  const nombre =
    safeString(
      getField(row, [
        'nombre',
        'cr_nombre',
        'cliente',
        'nombres',
        'nombrecliente',
        'deudor',
        'nombrecompleto',
      ])
    ) || 'Cliente';

  const telefono =
    safeString(
      getField(row, [
        'telefono',
        'celularsmsdeudor1',
        'fonodomiciliodeudor1',
        'telefono1',
        'celular',
        'movil',
        'phone',
      ])
    ) || 'No disponible';

  const ciudad =
    safeString(getField(row, ['ciudad', 'city', 'canton', 'poblacion'])) || 'Quito';

  const diasMora = parseIntSafe(
    getField(row, ['diasmora', 'diasdemora', 'diasretraso', 'mora'])
  );

  const monto = parseMoney(
    getField(row, [
      'obligacionvencida',
      'monto',
      'montoadeuda',
      'totalvencido',
      'deuda',
      'saldo',
      'valor',
    ])
  );

  const garantia =
    safeString(getField(row, ['garantia', 'tipogarantia', 'garantiareal'])) || 'PAG';

  const juicio =
    safeString(getField(row, ['juicio', 'numerojuicio', 'numjuicio'])) || 'Sin juicio';

  return buildDecision({
    nombre,
    telefono,
    ciudad,
    diasMora,
    monto,
    garantia,
    juicio,
    canal: 'WHATSAPP',
  });
}

function tryReadRealClientFromLocalStorage(): DemoClient | null {
  if (typeof window === 'undefined') return null;

  const preferredKeys = [
    'crm_selected_client',
    'selectedClient',
    'selectedRow',
    'activeClient',
    'currentClient',
  ];

  for (const key of preferredKeys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return mapRowToClient(parsed as Record<string, unknown>);
      }
    } catch {
      // ignorar
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;

    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null) {
        const row = parsed.find((item) => {
          if (!item || typeof item !== 'object') return false;
          const obj = item as Record<string, unknown>;
          const name = getField(obj, ['nombre', 'cr_nombre', 'cliente', 'deudor', 'nombrecompleto']);
          return safeString(name) !== '';
        }) as Record<string, unknown> | undefined;

        if (row) return mapRowToClient(row);
      }

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        const name = getField(obj, ['nombre', 'cr_nombre', 'cliente', 'deudor', 'nombrecompleto']);
        if (safeString(name) !== '') return mapRowToClient(obj);
      }
    } catch {
      // ignorar
    }
  }

  return null;
}

function buildCallFlow(client: DemoClient): CallStep[] {
  if (client.fueraDeHorario) {
    return [
      { who: 'SYSTEM', text: 'Llamada entrante detectada fuera de horario.' },
      {
        who: 'BOT',
        text: 'Hola, gracias por comunicarte con Discovery Innova. En este momento estamos fuera del horario de atención.',
      },
      {
        who: 'BOT',
        text: 'Hemos registrado tu llamada y un asesor te devolverá el contacto en la próxima franja hábil.',
      },
      {
        who: 'CLIENTE',
        text: 'De acuerdo, quedo atento al retorno. Gracias.',
      },
      {
        who: 'SYSTEM',
        text: 'Resultado: llamada registrada y devolución automática agendada.',
      },
    ];
  }

  if (client.diasMora >= 90) {
    return [
      { who: 'SYSTEM', text: 'Bot inicia llamada prioritaria.' },
      {
        who: 'BOT',
        text: `Hola ${client.nombre}, te llamamos de Discovery Innova por seguimiento de tu caso.`,
      },
      {
        who: 'CLIENTE',
        text: 'Sí, indíqueme por favor.',
      },
      {
        who: 'BOT',
        text: `Registramos una obligación vencida por $${client.monto.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}. ¿Deseas que un asesor te contacte hoy mismo para revisar opciones?`,
      },
      {
        who: 'CLIENTE',
        text: 'Sí, necesito revisar alternativas.',
      },
      {
        who: 'SYSTEM',
        text: 'Resultado: cliente interesado, escalar a asesor prioritario.',
      },
    ];
  }

  return [
    { who: 'SYSTEM', text: 'Bot inicia llamada de seguimiento.' },
    {
      who: 'BOT',
      text: `Hola ${client.nombre}, te contactamos de Discovery Innova para seguimiento de tu caso.`,
    },
    {
      who: 'CLIENTE',
      text: 'Sí, te escucho.',
    },
    {
      who: 'BOT',
      text: 'Queremos ayudarte a coordinar el siguiente paso y dejar registrado tu caso para seguimiento.',
    },
    {
      who: 'CLIENTE',
      text: 'Perfecto, quedo atento a la información.',
    },
    {
      who: 'SYSTEM',
      text: 'Resultado: llamada atendida y seguimiento programado.',
    },
  ];
}

export default function TestPage() {
  const [client, setClient] = useState<DemoClient | null>(null);
  const [canal, setCanal] = useState<Channel>('WHATSAPP');
  const [callFlow, setCallFlow] = useState<CallStep[]>([]);

  useEffect(() => {
    const realClient = tryReadRealClientFromLocalStorage();

    if (realClient) {
      setClient(realClient);
      return;
    }

    setClient(
      buildDecision({
        nombre: 'VASCONEZ BENAVIDES LUCIA ESTEFANIA',
        telefono: '0963919870',
        ciudad: 'Quito',
        diasMora: 0,
        monto: 10010,
        garantia: 'PAG',
        juicio: '17230-2024-06684',
        canal: 'WHATSAPP',
      })
    );
  }, []);

  useEffect(() => {
    if (!client) return;

    const updated = buildDecision({
      nombre: client.nombre,
      telefono: client.telefono,
      ciudad: client.ciudad,
      diasMora: client.diasMora,
      monto: client.monto,
      garantia: client.garantia,
      juicio: client.juicio,
      canal,
    });

    setClient(updated);
    setCallFlow(canal === 'CALL' ? buildCallFlow(updated) : []);
  }, [canal]);

  if (!client) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Arial, sans-serif',
          background: '#f8fafc',
        }}
      >
        Cargando simulación...
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 900,
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800 }}>
            Simulación IA
          </div>

          <button
  type="button"
  onClick={() => {
    window.parent.postMessage('close-demo', '*');
  }}
  style={{
    background: '#111827',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    cursor: 'pointer',
  }}
>
  Cerrar
</button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 18,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => setCanal('WHATSAPP')}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: canal === 'WHATSAPP' ? '#111827' : '#e5e7eb',
              color: canal === 'WHATSAPP' ? '#ffffff' : '#111827',
            }}
          >
            Simular WhatsApp fuera de horario
          </button>

          <button
            onClick={() => setCanal('CALL')}
            style={{
              border: 'none',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              background: canal === 'CALL' ? '#111827' : '#e5e7eb',
              color: canal === 'CALL' ? '#ffffff' : '#111827',
            }}
          >
            Simular llamada con bot
          </button>
        </div>

        <div
          style={{
            borderRadius: 16,
            padding: 20,
            background: '#ecfdf5',
            border: '1px solid #86efac',
            marginBottom: canal === 'CALL' ? 18 : 0,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
            {client.titulo}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Cliente:</strong> {client.nombre}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Canal:</strong> {client.canal === 'CALL' ? 'Llamada entrante' : 'WhatsApp entrante'}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Teléfono:</strong> {client.telefono}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Ciudad:</strong> {client.ciudad}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Días de mora:</strong> {client.diasMora}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Obligación vencida:</strong> $
            {client.monto.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Garantía:</strong> {client.garantia}
          </div>

          <div style={{ marginBottom: 8 }}>
            <strong>Juicio:</strong> {client.juicio}
          </div>

          <div style={{ marginTop: 10, marginBottom: 10, lineHeight: 1.5 }}>
            <strong>Decisión IA:</strong> {client.decision}
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              borderRadius: 12,
              padding: 14,
              lineHeight: 1.6,
            }}
          >
            <strong>Respuesta automática:</strong> {client.respuesta}
          </div>
        </div>

        {canal === 'CALL' && (
          <div
            style={{
              borderRadius: 16,
              padding: 20,
              background: '#eff6ff',
              border: '1px solid #93c5fd',
              marginTop: 20,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
              Flujo de llamada con bot
            </div>

            {callFlow.map((step, i) => (
              <div key={`${step.who}-${i}`} style={{ marginBottom: 10 }}>
                <strong>{step.who}:</strong> {step.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}