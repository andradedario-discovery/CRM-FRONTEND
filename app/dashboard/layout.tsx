import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div>
        <Navbar />
        <main style={{ padding: '24px' }}>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
