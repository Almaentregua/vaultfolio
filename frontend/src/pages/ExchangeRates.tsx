import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileDown, Plus } from "lucide-react";
import { exchangeRatesApi, exportsApi } from "@/services/api";
import type { CreateExchangeRateData } from "@/types";
import { COMMON_CURRENCIES } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ExchangeRates() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [baseFetch, setBaseFetch] = useState("USD");
  const [filterBase, setFilterBase] = useState("");

  const [form, setForm] = useState<CreateExchangeRateData>({
    base_currency: "USD",
    target_currency: "CLP",
    rate: 0,
    date: new Date().toISOString().slice(0, 10),
  });

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["exchange-rates", filterBase],
    queryFn: () => exchangeRatesApi.list(filterBase || undefined),
  });

  const createMutation = useMutation({
    mutationFn: () => exchangeRatesApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
      setShowAdd(false);
    },
  });

  const fetchMutation = useMutation({
    mutationFn: () => exchangeRatesApi.fetch(baseFetch),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["exchange-rates"] });
      alert(data.message);
    },
    onError: () => alert("Error al obtener tipos de cambio. Intenta más tarde."),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de cambio</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rates.length} registros almacenados
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Agregar manual
          </button>
          <button
            className="btn-secondary"
            onClick={() => exportsApi.exchangeRates(filterBase || undefined)}
            title="Exportar tipos de cambio como CSV"
          >
            <FileDown className="w-4 h-4" />
            Exportar CSV
          </button>
          <div className="flex gap-1">
            <select
              className="input w-auto"
              value={baseFetch}
              onChange={(e) => setBaseFetch(e.target.value)}
            >
              {COMMON_CURRENCIES.filter((c) => !["BTC", "ETH"].includes(c)).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                )
              )}
            </select>
            <button
              className="btn-primary"
              onClick={() => fetchMutation.mutate()}
              disabled={fetchMutation.isPending}
            >
              <Download className="w-4 h-4" />
              {fetchMutation.isPending ? "Descargando..." : "Actualizar"}
            </button>
          </div>
        </div>
      </div>

      {/* Manual add form */}
      {showAdd && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            Agregar tipo de cambio manualmente
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Moneda base</label>
              <select
                className="input"
                value={form.base_currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, base_currency: e.target.value }))
                }
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Moneda destino</label>
              <select
                className="input"
                value={form.target_currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, target_currency: e.target.value }))
                }
              >
                {COMMON_CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tasa</label>
              <input
                type="number"
                className="input"
                value={form.rate || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, rate: parseFloat(e.target.value) }))
                }
                step="any"
                min="0"
                placeholder="ej: 950.5"
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button className="btn-secondary" onClick={() => setShowAdd(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary"
              onClick={() => createMutation.mutate()}
              disabled={!form.rate || createMutation.isPending}
            >
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <label className="label mb-0 shrink-0">Filtrar por base:</label>
        <select
          className="input w-auto"
          value={filterBase}
          onChange={(e) => setFilterBase(e.target.value)}
        >
          <option value="">Todas</option>
          {COMMON_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : rates.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            No hay tipos de cambio. Usa el botón "Actualizar" para descargar los
            últimos valores desde internet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Base</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Destino</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Tasa</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono font-semibold text-indigo-600">
                    {r.base_currency}
                  </td>
                  <td className="px-6 py-3 font-mono text-gray-700">
                    {r.target_currency}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {Number(r.rate).toLocaleString("es-CL", {
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-6 py-3 text-gray-500">{formatDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
