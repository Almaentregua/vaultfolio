import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp, Wallet } from "lucide-react";
import { portfolioApi } from "@/services/api";
import { COMMON_CURRENCIES } from "@/types";
import { formatCurrency, formatDateShort, formatNumber } from "@/lib/utils";

export default function Dashboard() {
  const [currency, setCurrency] = useState("USD");

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["portfolio", "summary", currency],
    queryFn: () => portfolioApi.summary(currency),
  });

  const { data: history, isLoading: loadingHistory } = useQuery({
    queryKey: ["portfolio", "history", currency],
    queryFn: () => portfolioApi.history(currency, 90),
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen de tu patrimonio
          </p>
        </div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="input w-auto"
        >
          {COMMON_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Net Worth Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-sm font-medium text-gray-500">
            Patrimonio total
          </span>
        </div>
        {loadingSummary ? (
          <div className="h-10 w-48 bg-gray-100 animate-pulse rounded-lg" />
        ) : (
          <p className="text-4xl font-bold text-gray-900 font-mono">
            {formatCurrency(summary?.total_net_worth ?? 0, currency)}
          </p>
        )}
        <p className="text-sm text-gray-400 mt-1">en {currency}</p>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio history */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Evolución (90 días)</h2>
          </div>
          {loadingHistory ? (
            <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={history?.history ?? []}>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateShort}
                  tick={{ fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(v) => formatNumber(v, 0)}
                  tick={{ fontSize: 11 }}
                  width={70}
                />
                <Tooltip
                  formatter={(v: number) => [formatCurrency(v, currency), "Total"]}
                  labelFormatter={formatDateShort}
                />
                <Line
                  type="monotone"
                  dataKey="total_converted"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Asset type breakdown */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Por tipo de activo</h2>
          {loadingSummary ? (
            <div className="h-48 bg-gray-50 animate-pulse rounded-lg" />
          ) : (summary?.by_asset_type.length ?? 0) === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              Sin inversiones aún
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={summary?.by_asset_type}
                    dataKey="total_converted"
                    nameKey="asset_type_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                  >
                    {summary?.by_asset_type.map((entry) => (
                      <Cell key={entry.asset_type_id} fill={entry.asset_type_color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v, currency)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <ul className="flex-1 space-y-2">
                {summary?.by_asset_type.map((entry) => (
                  <li key={entry.asset_type_id} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: entry.asset_type_color }}
                    />
                    <span className="text-sm text-gray-700 flex-1 truncate">
                      {entry.asset_type_name}
                    </span>
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      {entry.percentage.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Investments table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Todas las inversiones</h2>
        </div>
        {loadingSummary ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (summary?.investments.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No hay inversiones registradas. Agrega una en la sección Inversiones.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Plataforma</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Monto original</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">
                  En {currency}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary?.investments.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{inv.name}</td>
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ background: inv.asset_type_color }}
                    >
                      {inv.asset_type_name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{inv.platform ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-700">
                    {formatCurrency(inv.current_amount, inv.currency)}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-gray-900">
                    {formatCurrency(inv.current_amount_converted, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
