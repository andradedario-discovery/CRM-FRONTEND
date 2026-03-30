'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const data = [
  { mes: 'Ene', ventas: 12 },
  { mes: 'Feb', ventas: 19 },
  { mes: 'Mar', ventas: 14 },
  { mes: 'Abr', ventas: 28 },
  { mes: 'May', ventas: 22 },
  { mes: 'Jun', ventas: 31 },
];

export default function SalesChart() {
  return (
    <div style={{ width: '100%', height: 280 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="ventas" stroke="#2563eb" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}