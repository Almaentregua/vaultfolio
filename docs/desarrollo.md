# Guía de desarrollo

Esta guía describe la arquitectura del proyecto, las convenciones de código y cómo extender la aplicación.

---

## Arquitectura general

```
┌─────────────────────────────────────────────────────────┐
│                    Navegador                            │
│                                                         │
│  React + TypeScript + Vite (:5173)                      │
│  ├── TanStack Query  (caché, loading, invalidación)     │
│  ├── Recharts        (gráficos)                         │
│  └── Axios           (HTTP)                             │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTP /api/* → proxy → :8000
                           │
┌──────────────────────────▼──────────────────────────────┐
│                    FastAPI (:8000)                       │
│                                                         │
│  routers/   → endpoints REST (CRUD + lógica simple)     │
│  services/  → lógica de negocio (portfolio, cambio)     │
│  schemas/   → validación de entrada/salida (Pydantic)   │
│  models/    → definición de tablas (SQLAlchemy ORM)     │
└──────────────────────────┬──────────────────────────────┘
                           │ SQLAlchemy
                           │
┌──────────────────────────▼──────────────────────────────┐
│            SQLite — backend/vaultfolio.db                │
│                                                         │
│  asset_types       platforms        investments         │
│  investment_records   exchange_rates                    │
└─────────────────────────────────────────────────────────┘
```

---

## Backend — capas

### `models/` — definición de tablas

Los modelos de SQLAlchemy 2.0 usan la API `Mapped[]` con anotaciones de tipo. Cada modelo corresponde a una tabla en la BD.

```python
# Ejemplo de campo tipado
class Investment(Base):
    __tablename__ = "investments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
```

Las relaciones se declaran con `relationship()` y se referencian con `TYPE_CHECKING` para evitar importaciones circulares.

### `schemas/` — validación de entrada y salida

Cada entidad tiene hasta 3 schemas Pydantic:

| Schema | Propósito |
|---|---|
| `*Create` | Campos necesarios para crear (request body del POST) |
| `*Update` | Todos los campos opcionales (request body del PATCH) |
| `*Read` | Lo que retorna la API (incluye `id`, timestamps, relaciones) |

El schema `Read` usa `model_config = {"from_attributes": True}` para deserializar directamente desde objetos ORM de SQLAlchemy.

### `routers/` — endpoints HTTP

Los routers usan `APIRouter` con un `prefix` y `tags` para agruparlos en Swagger. Cada endpoint:
1. Recibe datos validados por el schema de entrada
2. Llama al servicio o directamente a la BD
3. Retorna un schema de salida

```python
@router.post("/", response_model=InvestmentRead, status_code=201)
def create_investment(data: InvestmentCreate, db: Session = Depends(get_db)):
    ...
```

La sesión de BD se inyecta automáticamente con `Depends(get_db)`.

### `services/` — lógica de negocio

La lógica que involucra múltiples modelos o cálculos no triviales vive en servicios:

- **`services/portfolio.py`** — cálculo de patrimonio total, desglose y serie histórica
- **`services/exchange_rate.py`** — resolución de tasas y descarga desde API externa

Los routers llaman a los servicios; los servicios nunca llaman a los routers.

### `seeds.py` — datos iniciales

Se ejecuta al iniciar la app (en el `lifespan` de FastAPI). Es idempotente: verifica si el slug ya existe antes de insertar.

---

## Frontend — estructura

### `types/index.ts` — contratos TypeScript

Todas las interfaces y tipos que representan entidades del backend. Es la fuente de verdad del frontend para el tipado:

```typescript
export interface Investment {
  id: number;
  name: string;
  currency: string;
  current_amount: number | null;
  // ...
}
```

### `services/api.ts` — cliente HTTP

Funciones tipadas organizadas por recurso (`assetTypesApi`, `investmentsApi`, etc.). Usan `axios` con `baseURL: '/api'` (ruta relativa que el proxy de Vite redirige al backend).

```typescript
export const investmentsApi = {
  list: (activeOnly = true) =>
    http.get<Investment[]>('/investments/', { params: { active_only: activeOnly } })
        .then(r => r.data),
  // ...
}
```

### `pages/` — componentes de página

Cada página:
1. Usa `useQuery` de TanStack Query para obtener datos (con caché automático)
2. Usa `useMutation` para crear/actualizar/eliminar (invalida el caché al completar)
3. Muestra estados de carga con skeletons

```typescript
const { data: investments, isLoading } = useQuery({
  queryKey: ['investments'],
  queryFn: () => investmentsApi.list(),
})

const createMutation = useMutation({
  mutationFn: investmentsApi.create,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investments'] }),
})
```

### `lib/utils.ts` — helpers reutilizables

| Función | Uso |
|---|---|
| `cn(...classes)` | Merge de clases Tailwind con `clsx` + `tailwind-merge` |
| `formatCurrency(amount, currency)` | Formato de moneda con `Intl.NumberFormat` en locale `es-CL`. Para cripto (BTC, ETH) usa formato numérico simple. |
| `formatNumber(amount, decimals)` | Número con separadores de miles en locale `es-CL` |
| `formatDate(dateStr)` | Fecha completa: `dd/mm/yyyy` |
| `formatDateShort(dateStr)` | Fecha corta: `dd Mes` (para ejes de gráficos) |

---

## Flujo de datos — ejemplo completo

Registrar un nuevo valor para una inversión:

```
1. Usuario hace clic en "Registrar valor" (icono trending) en Investments.tsx
2. Se abre AddRecordModal con el objeto Investment
3. Usuario ingresa monto, fecha y nota → clic en "Guardar"
4. React invoca investmentsApi.addRecord(inv.id, { amount, recorded_at, note })
5. Axios hace POST /api/{inv_id}/records
6. Vite proxy redirige a http://localhost:8000/investments/{inv_id}/records
7. FastAPI valida el body con InvestmentRecordCreate
8. El router crea InvestmentRecord en la BD y hace commit
9. FastAPI retorna el objeto creado (InvestmentRecordRead)
10. onSuccess de useMutation invalida queryKey ['investments'] y ['portfolio']
11. TanStack Query refetch automático → UI se actualiza con el nuevo valor
```

---

## Convenciones de código

### Naming

- **Python**: snake_case para funciones y variables, PascalCase para clases
- **TypeScript**: camelCase para funciones y variables, PascalCase para componentes e interfaces
- **Campos de entidades**: en inglés en la BD y en el código; en español solo en la UI

### Schemas Pydantic

Siempre definir schemas separados para Create, Update y Read. Evitar exponer el mismo schema para input y output.

### Invalidación de queries en React

Después de toda mutación exitosa, invalidar los `queryKey` relevantes:

```typescript
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ['investments'] })
  qc.invalidateQueries({ queryKey: ['portfolio'] })  // portfolio también cambia
}
```

### CSS con Tailwind

Usar las clases `card`, `btn-primary`, `btn-secondary`, `input`, `label` definidas en `src/index.css` para mantener consistencia visual.

---

## Cómo agregar un nuevo tipo de activo

Los tipos de activo son datos, no código. No se necesita modificar ningún archivo:

1. En la app, ir a **Tipos de Activo**
2. Hacer clic en **Nuevo tipo**
3. Completar nombre, slug (se genera automáticamente), descripción y color
4. Guardar

El nuevo tipo queda disponible inmediatamente en el formulario de inversiones.

---

## Cómo agregar un nuevo campo a las inversiones

Ejemplo: agregar un campo `ticker` (símbolo bursátil) a las inversiones.

### 1. Modelo (`backend/app/models/investment.py`)

```python
ticker: Mapped[str | None] = mapped_column(String(20))
```

### 2. Schemas (`backend/app/schemas/investment.py`)

```python
class InvestmentBase(BaseModel):
    # ...campos existentes...
    ticker: str | None = None  # agregar aquí

class InvestmentRead(InvestmentBase):
    # ticker se hereda de Base
    ...
```

### 3. Resetear la base de datos

Como se usa `create_all` sin migraciones, el nuevo campo no se agrega automáticamente a una BD existente. Reiniciar desde cero:

```bash
rm backend/vaultfolio.db
make dev-backend
```

### 4. Tipo TypeScript (`frontend/src/types/index.ts`)

```typescript
export interface Investment {
  // ...campos existentes...
  ticker: string | null;
}

export interface CreateInvestmentData {
  // ...campos existentes...
  ticker?: string;
}
```

### 5. API service (`frontend/src/services/api.ts`)

El campo se incluye automáticamente si está en el body enviado. No se necesitan cambios si `CreateInvestmentData` ya lo incluye.

### 6. UI (`frontend/src/pages/Investments.tsx`)

Agregar el campo en `AddInvestmentModal`:

```tsx
<div>
  <label className="label">Ticker (opcional)</label>
  <input
    type="text"
    className="input"
    value={form.ticker ?? ''}
    onChange={e => set('ticker', e.target.value)}
    placeholder="Ej: AAPL, BTC"
  />
</div>
```

---

## Cómo agregar una nueva página al frontend

Seguir el patrón existente de las páginas en `src/pages/`:

### 1. Crear la página (`frontend/src/pages/MiPagina.tsx`)

```tsx
import { useQuery } from '@tanstack/react-query'
import { miRecursoApi } from '@/services/api'

export default function MiPagina() {
  const { data, isLoading } = useQuery({
    queryKey: ['mi-recurso'],
    queryFn: miRecursoApi.list,
  })

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">Mi Página</h1>
      {/* contenido */}
    </div>
  )
}
```

### 2. Registrar la ruta (`frontend/src/App.tsx`)

```tsx
import MiPagina from '@/pages/MiPagina'

// Dentro de <Routes>:
<Route path="/mi-pagina" element={<MiPagina />} />
```

### 3. Agregar al sidebar (`frontend/src/components/Layout.tsx`)

```tsx
import { Star } from 'lucide-react'

const nav = [
  // ...rutas existentes...
  { to: '/mi-pagina', label: 'Mi Página', icon: Star },
]
```

---

## Monedas soportadas

La constante `COMMON_CURRENCIES` en `frontend/src/types/index.ts` define las monedas disponibles en los selectores de la UI.

| Código | Moneda |
|---|---|
| USD | Dólar estadounidense |
| EUR | Euro |
| CLP | Peso chileno |
| ARS | Peso argentino |
| BRL | Real brasileño |
| MXN | Peso mexicano |
| COP | Peso colombiano |
| PEN | Sol peruano |
| UYU | Peso uruguayo |
| GBP | Libra esterlina |
| JPY | Yen japonés |
| CHF | Franco suizo |
| BTC | Bitcoin |
| ETH | Ethereum |

Para agregar una moneda, incluirla en el array `COMMON_CURRENCIES`. Los tipos de cambio deben estar disponibles en la BD para que la conversión funcione (o se puede usar el par directo).

> Para BTC y ETH no hay soporte en `open.er-api.com`. Agregar los tipos de cambio manualmente o integrar una API de cripto.

---

## Base de datos SQLite

### Ubicación

```
backend/vaultfolio.db
```

### Tablas

| Tabla | Modelo | Descripción |
|---|---|---|
| `asset_types` | `AssetType` | Tipos de activo configurables |
| `platforms` | `Platform` | Plataformas/brokers donde se mantienen inversiones |
| `investments` | `Investment` | Posiciones de inversión |
| `investment_records` | `InvestmentRecord` | Historial de valores por inversión |
| `exchange_rates` | `ExchangeRate` | Tipos de cambio por fecha |

Ver columnas, tipos y relaciones detallados en [`docs/schema.md`](schema.md).

### Creación

Las tablas se crean automáticamente con `Base.metadata.create_all(bind=engine)` al iniciar el backend. Si la BD ya existe, solo crea las tablas que falten.

### Reset completo

```bash
# 1. Detener el backend
# 2. Eliminar el archivo
rm backend/vaultfolio.db
# 3. Reiniciar (se recrea con seeds)
make dev-backend
```

### Backup

Copiar el archivo `.db` a cualquier ubicación:

```bash
cp backend/vaultfolio.db ~/backup/vaultfolio-$(date +%Y%m%d).db
```

### Migraciones

El proyecto no usa Alembic actualmente. Para agregar nuevos campos a tablas existentes, la alternativa más sencilla es resetear la BD. Si se desea agregar Alembic:

```bash
pip install alembic
alembic init alembic
# Configurar alembic.ini con DATABASE_URL
# Editar alembic/env.py para importar Base y todos los modelos
alembic revision --autogenerate -m "descripcion"
alembic upgrade head
```
