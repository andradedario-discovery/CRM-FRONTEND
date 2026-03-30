import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CRM Discovery Innova',
  description: 'CRM de ventas y cobranzas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="crm-layout">
          <aside className="crm-sidebar">
            <div className="crm-logo">
              Discovery CRM
              <span>Ventas + Cobranzas</span>
            </div>

            <nav className="crm-nav">
              <Link href="/leads">Leads</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/cobranzas">Cobranzas</Link>
            </nav>
          </aside>

          <div className="crm-main">
            <header className="crm-topbar">
              <div className="crm-topbar-title">Panel Comercial</div>
              <div className="crm-badge">Demo SaaS</div>
            </header>

            <main className="crm-content">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}