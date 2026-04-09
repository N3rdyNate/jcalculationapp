'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';
import type { ComponentLoad } from '@/lib/calc/types';

interface Props {
  components: ComponentLoad[];
}

export function BreakdownChart({ components }: Props) {
  const data = components.map((c) => ({
    name: c.label.replace('Windows solar ', 'Sol-').replace('Windows (conduction)', 'Win cond'),
    heating: Math.round(c.heating),
    cooling: Math.round(c.coolingSensible + c.coolingLatent),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            angle={-35}
            textAnchor="end"
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            formatter={(v: number) => `${Math.round(v).toLocaleString()} BTU/hr`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="heating" name="Heating" fill="#dc2626" />
          <Bar dataKey="cooling" name="Cooling" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
