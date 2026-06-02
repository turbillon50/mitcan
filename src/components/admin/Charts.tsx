"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const AXIS = { fontSize: 11, fill: "#b39080" };
const GRID = "rgba(255,210,180,0.08)";
const TOOLTIP = {
  contentStyle: {
    background: "#1b1b1b",
    border: "1px solid rgba(255,210,180,0.15)",
    borderRadius: 12,
    color: "#fff6ee",
    fontSize: 12,
  },
};
const PALETTE = ["#ff8c00", "#ffb77d", "#cc2b18", "#e8a23a", "#9a5b2a", "#5a3020"];

export function VentasArea({
  data,
}: {
  data: { fecha: string; ventas: number; pedidos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff8c00" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#ff8c00" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="fecha" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} width={48} />
        <Tooltip {...TOOLTIP} />
        <Area
          type="monotone"
          dataKey="ventas"
          name="Ventas"
          stroke="#ff8c00"
          strokeWidth={2.5}
          fill="url(#vg)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductosBar({
  data,
}: {
  data: { nombre: string; ingresos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nombre"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip {...TOOLTIP} cursor={{ fill: "rgba(255,140,0,0.06)" }} />
        <Bar dataKey="ingresos" name="Ingresos" radius={[0, 6, 6, 0]} fill="#ff8c00" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EstadoPie({
  data,
}: {
  data: { estado: string; pedidos: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="pedidos"
          nameKey="estado"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#b39080" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
