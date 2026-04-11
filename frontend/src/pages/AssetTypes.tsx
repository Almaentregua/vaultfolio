import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { assetTypesApi } from "@/services/api";
import type { AssetType, CreateAssetTypeData } from "@/types";

const PRESET_COLORS = [
  "#6366f1", "#10b981", "#f59e0b", "#f97316",
  "#3b82f6", "#8b5cf6", "#ef4444", "#ec4899",
];

function AssetTypeForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: AssetType;
  onSave: (data: CreateAssetTypeData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CreateAssetTypeData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    color: initial?.color ?? "#6366f1",
    icon: initial?.icon ?? "wallet",
  });

  const set = (key: keyof CreateAssetTypeData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const autoSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nombre</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!initial) set("slug", autoSlug(e.target.value));
            }}
            placeholder="Ej: Fondos Mutuos"
          />
        </div>
        <div>
          <label className="label">Slug</label>
          <input
            type="text"
            className="input"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="fondos-mutuos"
          />
        </div>
      </div>
      <div>
        <label className="label">Descripción (opcional)</label>
        <input
          type="text"
          className="input"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div>
        <label className="label">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: form.color === c ? "#111" : "transparent",
              }}
              onClick={() => set("color", c)}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => set("color", e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border border-gray-300"
            title="Color personalizado"
          />
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="btn-primary"
          onClick={() => onSave(form)}
          disabled={!form.name || !form.slug}
        >
          {initial ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

export default function AssetTypes() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<AssetType | null>(null);

  const { data: assetTypes = [], isLoading } = useQuery({
    queryKey: ["asset-types"],
    queryFn: assetTypesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: assetTypesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asset-types"] });
      setShowAdd(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAssetTypeData> }) =>
      assetTypesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["asset-types"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: assetTypesApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["asset-types"] }),
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de activo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Categorías de inversión configurables
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" />
          Nuevo tipo
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nuevo tipo de activo</h2>
          <AssetTypeForm
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-28 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assetTypes.map((at) => (
            <div key={at.id} className="card p-5">
              {editing?.id === at.id ? (
                <AssetTypeForm
                  initial={at}
                  onSave={(data) => updateMutation.mutate({ id: at.id, data })}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl shrink-0"
                      style={{ background: at.color }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{at.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {at.investment_count} inversión
                        {at.investment_count !== 1 ? "es" : ""}
                      </p>
                      {at.description && (
                        <p className="text-sm text-gray-500 mt-1">{at.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      onClick={() => setEditing(at)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        if (at.investment_count > 0) {
                          alert("No se puede eliminar un tipo con inversiones activas.");
                          return;
                        }
                        if (confirm(`¿Eliminar "${at.name}"?`)) {
                          deleteMutation.mutate(at.id);
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
