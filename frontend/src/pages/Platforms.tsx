import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { platformsApi } from "@/services/api";
import type { CreatePlatformData, Platform } from "@/types";

function PlatformForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Platform;
  onSave: (data: CreatePlatformData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreatePlatformData>({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nombre</label>
        <input
          type="text"
          className="input"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej: Fintual, BCI, Buda.com"
        />
      </div>
      <div>
        <label className="label">Descripción (opcional)</label>
        <input
          type="text"
          className="input"
          value={form.description ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Ej: Exchange de criptomonedas"
        />
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="btn-primary"
          onClick={() => onSave(form)}
          disabled={!form.name.trim()}
        >
          {initial ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

export default function Platforms() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Platform | null>(null);

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ["platforms"],
    queryFn: platformsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: platformsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platforms"] });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePlatformData> }) =>
      platformsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platforms"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: platformsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["platforms"] }),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plataformas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Brokers, bancos y servicios donde tenés inversiones
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Nueva plataforma
        </button>
      </div>

      {showAdd && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nueva plataforma</h2>
          <PlatformForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-24 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : platforms.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          No hay plataformas. Agrega la primera.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map((p) => (
            <div key={p.id} className="card p-5">
              {editing?.id === p.id ? (
                <PlatformForm
                  initial={p}
                  onSave={(data) => updateMutation.mutate({ id: p.id, data })}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.investment_count} inversión
                      {p.investment_count !== 1 ? "es activas" : " activa"}
                    </p>
                    {p.description && (
                      <p className="text-sm text-gray-500 mt-1">{p.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      onClick={() => setEditing(p)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        if (p.investment_count > 0) {
                          alert("No se puede eliminar una plataforma con inversiones activas.");
                          return;
                        }
                        if (confirm(`¿Eliminar "${p.name}"?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
