import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM Discovery Innova',
  description: 'CRM de ventas y cobranzas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <div className="crm-layout">
          {/* SIDEBAR */}
          <aside className="crm-sidebar">
     <div
  className="crm-logo"
  style={{
    background: '#ffffff',
    padding: 10,
    borderRadius: 10,
  }}
>
              <img
                src="/discovery-logo-circle.png"
                alt="Discovery CRM"
                style={{ height: 28 }}
              />
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                Ventas + Cobranzas
              </span>
            </div>

            <nav className="crm-nav">
              <Link href="/leads">Leads</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/cobranzas">Cobranzas</Link>
            </nav>
          </aside>

          {/* MAIN */}
          <div className="crm-main">
            {/* TOPBAR */}
            <header
              className="crm-topbar"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                borderBottom: '1px solid #e5e7eb',
                background: '#ffffff',
              }}
            >
              {/* IZQUIERDA */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#111827',
                  }}
                >
                  Panel Comercial
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: '#6b7280',
                  }}
                >
                  Discovery Innova · CRM de ventas y cobranzas
                </div>
              </div>

              {/* DERECHA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    background: '#0E2217',
                    color: '#D4AF37',
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: '6px 12px',
                    fontSize: 12,
                  }}
                >
                  Discovery Innova
                </div>

                <button
                  style={{
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Salir
                </button>
              </div>
            </header>

            {/* CONTENIDO */}
            <main className="crm-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}