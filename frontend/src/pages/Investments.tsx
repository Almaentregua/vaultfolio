import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Plus, Trash2, TrendingUp } from "lucide-react";
import { assetTypesApi, exportsApi, investmentsApi, platformsApi } from "@/services/api";
import type { CreateInvestmentData, Investment } from "@/types";
import { COMMON_CURRENCIES } from "@/types";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";

// ── Add Record Modal ──────────────────────────────────────────────────────────

function AddRecordModal({
  investment,
  onClose,
}: {
  investment: Investment;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [note, setNote] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      investmentsApi.addRecord(investment.id, {
        amount: parseFloat(amount),
        recorded_at: new Date(date).toISOString(),
        note: note || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">
          Registrar valor — {investment.name}
        </h2>
        <div>
          <label className="label">
            Monto ({investment.currency})
          </label>
          <input
            type="number"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="any"
          />
        </div>
        <div>
          <label className="label">Fecha</label>
          <input
            type="datetime-local"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input
            type="text"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ej: rendimiento mensual"
          />
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => mutation.mutate()}
            disabled={!amount || mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Investment Modal ──────────────────────────────────────────────────────

function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: assetTypes = [] } = useQuery({
    queryKey: ["asset-types"],
    queryFn: assetTypesApi.list,
  });
  const { data: platforms = [] } = useQuery({
    queryKey: ["platforms"],
    queryFn: platformsApi.list,
  });

  const [form, setForm] = useState<CreateInvestmentData>({
    name: "",
    asset_type_id: assetTypes[0]?.id ?? 0,
    currency: "USD",
    platform_id: undefined,
    notes: "",
    initial_amount: undefined,
  });

  const mutation = useMutation({
    mutationFn: () =>
      investmentsApi.create({
        ...form,
        asset_type_id: Number(form.asset_type_id),
        platform_id: form.platform_id || undefined,
        notes: form.notes || undefined,
        initial_date: form.initial_amount
          ? new Date().toISOString()
          : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    },
  });

  const set = (key: keyof CreateInvestmentData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Nueva inversión</h2>

        <div>
          <label className="label">Nombre</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Fondo Mutuo Larraín Vial"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tipo de activo</label>
            <select
              className="input"
              value={form.asset_type_id}
              onChange={(e) => set("asset_type_id", Number(e.target.value))}
            >
              {assetTypes.map((at) => (
                <option key={at.id} value={at.id}>
                  {at.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Moneda</label>
            <select
              className="input"
              value={form.currency}
              onChange={(e) => set("currency", e.target.value)}
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Plataforma (opcional)</label>
          <select
            className="input"
            value={form.platform_id ?? ""}
            onChange={(e) =>
              set("platform_id", e.target.value ? Number(e.target.value) : undefined)
            }
          >
            <option value="">Sin plataforma</option>
            {platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Monto inicial (opcional)</label>
          <input
            type="number"
            className="input"
            value={form.initial_amount ?? ""}
            onChange={(e) =>
              set(
                "initial_amount",
                e.target.value ? parseFloat(e.target.value) : undefined
              )
            }
            placeholder="0"
            min="0"
            step="any"
          />
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <textarea
            className="input resize-none"
            rows={2}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => mutation.mutate()}
            disabled={!form.name || !form.asset_type_id || mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Investments() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [recordTarget, setRecordTarget] = useState<Investment | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investments"],
    queryFn: () => investmentsApi.list(false),
  });

  const { data: assetTypes = [] } = useQuery({
    queryKey: ["asset-types"],
    queryFn: assetTypesApi.list,
  });

  const { data: platforms = [] } = useQuery({
    queryKey: ["platforms"],
    queryFn: platformsApi.list,
  });

  const filtered = investments.filter((inv) => {
    if (filterType !== "all" && inv.asset_type_id !== Number(filterType)) return false;
    if (filterPlatform === "none") return inv.platform_id == null;
    if (filterPlatform !== "all" && inv.platform_id !== Number(filterPlatform)) return false;
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: investmentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inversiones</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length === investments.length
              ? `${investments.length} inversiones registradas`
              : `${filtered.length} de ${investments.length} inversiones`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            onClick={() => exportsApi.records()}
            title="Exportar historial de valores"
          >
            <FileDown className="w-4 h-4" />
            Exportar historial
          </button>
          <button
            className="btn-secondary"
            onClick={() => exportsApi.investments()}
            title="Exportar lista de inversiones"
          >
            <FileDown className="w-4 h-4" />
            Exportar inversiones
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" />
            Nueva inversión
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          className="input w-auto"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Todos los tipos</option>
          {assetTypes.map((at) => (
            <option key={at.id} value={at.id}>
              {at.name}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
        >
          <option value="all">Todas las plataformas</option>
          <option value="none">Sin plataforma</option>
          {platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">
              No hay inversiones aún. ¡Agrega la primera!
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-sm">
              Ninguna inversión coincide con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Plataforma</th>
                <th className="text-right px-6 py-3 font-medium text-gray-500">Valor actual</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Actualizado</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900">{inv.name}</td>
                  <td className="px-6 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ background: inv.asset_type.color }}
                    >
                      {inv.asset_type.name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{inv.platform?.name ?? "—"}</td>
                  <td className="px-6 py-3 text-right font-mono">
                    {inv.current_amount != null ? (
                      <>
                        <span className="text-xs text-gray-400 mr-1.5">{inv.currency}</span>
                        {formatNumber(inv.current_amount, 2)}
                      </>
                    ) : (
                      <span className="text-gray-400">sin registros</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-500">
                    {inv.last_recorded_at ? formatDate(inv.last_recorded_at) : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.is_active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {inv.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Registrar valor"
                        onClick={() => setRecordTarget(inv)}
                      >
                        <TrendingUp className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                        onClick={() => {
                          if (confirm(`¿Eliminar "${inv.name}"?`)) {
                            deleteMutation.mutate(inv.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddInvestmentModal onClose={() => setShowAdd(false)} />}
      {recordTarget && (
        <AddRecordModal
          investment={recordTarget}
          onClose={() => setRecordTarget(null)}
        />
      )}
    </div>
  );
}
