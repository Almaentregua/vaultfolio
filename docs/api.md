# Referencia de la API REST

La API de Vaultfolio es una API REST construida con FastAPI. Cuando el backend está corriendo, también está disponible la documentación interactiva Swagger UI en [http://localhost:8000/docs](http://localhost:8000/docs).

---

## URL base

```
http://localhost:8000
```

## Convenciones

| Aspecto | Detalle |
|---|---|
| Formato de respuesta | JSON |
| Fechas | ISO 8601 — `YYYY-MM-DDTHH:MM:SS` (datetime) o `YYYY-MM-DD` (date) |
| Monedas | Código ISO 4217 — `USD`, `CLP`, `EUR`, `ARS`, etc. |
| Números decimales | Representados como string en JSON para preservar precisión (`"1234.567890"`) |
| Autenticación | Ninguna (app local personal) |
| Errores | `{"detail": "mensaje de error"}` con código HTTP correspondiente |

---

## Tipos de Activo — `/asset-types`

Los tipos de activo son categorías de inversión completamente configurables. La app incluye 6 por defecto, pero se pueden agregar o modificar libremente.

### `GET /asset-types/`

Lista todos los tipos de activo con el conteo de inversiones activas asociadas.

**Respuesta `200`:**
```json
[
  {
    "id": 1,
    "name": "Fondos Mutuos",
    "slug": "fondos-mutuos",
    "description": "Fondos de inversión colectiva gestionados por administradoras",
    "color": "#6366f1",
    "icon": "trending-up",
    "created_at": "2024-01-15T10:00:00",
    "investment_count": 3
  }
]
```

---

### `POST /asset-types/`

Crea un nuevo tipo de activo.

**Body:**
```json
{
  "name": "Préstamos P2P",
  "slug": "prestamos-p2p",
  "description": "Préstamos entre personas vía plataformas digitales",
  "color": "#06b6d4",
  "icon": "users"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | Nombre visible en la UI |
| `slug` | string | Sí | Identificador único, solo letras minúsculas y guiones |
| `description` | string | No | Descripción opcional |
| `color` | string | No | Color hexadecimal, default `#6366f1` |
| `icon` | string | No | Nombre del ícono, default `wallet` |

**Respuesta `201`:** objeto creado  
**Error `409`:** ya existe un tipo con ese slug

---

### `GET /asset-types/{id}`

Obtiene un tipo de activo por ID.

**Respuesta `200`:** objeto del tipo  
**Error `404`:** no encontrado

---

### `PATCH /asset-types/{id}`

Actualiza parcialmente un tipo de activo. Solo se actualizan los campos enviados.

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "description": "Nueva descripción",
  "color": "#ef4444",
  "icon": "star"
}
```

**Respuesta `200`:** objeto actualizado  
**Error `404`:** no encontrado

> El campo `slug` no se puede cambiar después de la creación para mantener consistencia.

---

### `DELETE /asset-types/{id}`

Elimina un tipo de activo.

**Respuesta `204`:** eliminado correctamente  
**Error `404`:** no encontrado  
**Error `409`:** el tipo tiene inversiones asociadas (activas o inactivas)

---

## Inversiones — `/investments`

Las inversiones representan posiciones individuales en activos. El valor actual se obtiene del último registro histórico.

### `GET /investments/`

Lista inversiones.

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `active_only` | boolean | `true` | Si `false`, incluye inversiones inactivas |

**Respuesta `200`:**
```json
[
  {
    "id": 1,
    "name": "Fondo Mutuo Larraín Vial",
    "asset_type_id": 1,
    "asset_type": { "id": 1, "name": "Fondos Mutuos", ... },
    "platform": "Larraín Vial",
    "currency": "CLP",
    "notes": null,
    "is_active": true,
    "created_at": "2024-01-15T10:00:00",
    "updated_at": "2024-01-15T10:00:00",
    "current_amount": "5000000.000000",
    "last_recorded_at": "2024-03-01T00:00:00"
  }
]
```

---

### `POST /investments/`

Crea una nueva inversión. Opcionalmente puede registrar el valor inicial en el mismo request.

**Body:**
```json
{
  "name": "Bitcoin en Buda",
  "asset_type_id": 4,
  "platform": "Buda.com",
  "currency": "USD",
  "notes": "DCA mensual",
  "initial_amount": 1500.00,
  "initial_date": "2024-01-15T00:00:00"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | Sí | Nombre descriptivo |
| `asset_type_id` | integer | Sí | ID del tipo de activo |
| `currency` | string | Sí | Código de moneda (ej: `USD`, `CLP`) |
| `platform` | string | No | Plataforma o institución |
| `notes` | string | No | Notas libres |
| `initial_amount` | number | No | Si se incluye, crea el primer registro de valor |
| `initial_date` | datetime | No | Fecha del monto inicial (default: ahora) |

**Respuesta `201`:** inversión creada

---

### `GET /investments/{id}`

Obtiene una inversión con su último valor registrado.

**Respuesta `200`:** objeto de inversión  
**Error `404`:** no encontrada

---

### `PATCH /investments/{id}`

Actualiza parcialmente una inversión.

**Body (todos opcionales):**
```json
{
  "name": "Nuevo nombre",
  "platform": "Nueva plataforma",
  "notes": "Actualización de notas",
  "is_active": false
}
```

**Respuesta `200`:** objeto actualizado  
**Error `404`:** no encontrada

---

### `DELETE /investments/{id}`

Elimina una inversión y todos sus registros históricos (cascade).

**Respuesta `204`:** eliminada  
**Error `404`:** no encontrada

---

### `GET /investments/{id}/records`

Lista el historial de valores de una inversión, ordenado del más reciente al más antiguo.

**Respuesta `200`:**
```json
[
  {
    "id": 5,
    "investment_id": 1,
    "amount": "5250000.000000",
    "recorded_at": "2024-03-01T00:00:00",
    "note": "Rentabilidad +5%",
    "created_at": "2024-03-01T10:30:00"
  }
]
```

---

### `POST /investments/{id}/records`

Agrega un nuevo registro de valor (snapshot) a una inversión. El último registro agregado se considera el valor actual.

**Body:**
```json
{
  "amount": 5250000.00,
  "recorded_at": "2024-03-01T00:00:00",
  "note": "Rentabilidad +5%"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `amount` | number | Sí | Valor en la moneda original de la inversión |
| `recorded_at` | datetime | Sí | Fecha y hora del registro |
| `note` | string | No | Comentario opcional |

**Respuesta `201`:** registro creado  
**Error `404`:** inversión no encontrada

---

### `DELETE /investments/{id}/records/{record_id}`

Elimina un registro histórico específico.

**Respuesta `204`:** eliminado  
**Error `404`:** no encontrado

---

## Portfolio — `/portfolio`

Endpoints de cálculo consolidado. No modifican datos, solo calculan en base a inversiones y tipos de cambio existentes.

### `GET /portfolio/summary`

Retorna el resumen completo del patrimonio convertido a la moneda indicada.

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `currency` | string | `USD` | Moneda destino para la conversión |

**Respuesta `200`:**
```json
{
  "target_currency": "USD",
  "total_net_worth": "28450.320000",
  "by_asset_type": [
    {
      "asset_type_id": 1,
      "asset_type_name": "Fondos Mutuos",
      "asset_type_color": "#6366f1",
      "total_converted": "15000.00",
      "percentage": 52.7,
      "investment_count": 2
    }
  ],
  "by_currency": [
    {
      "currency": "CLP",
      "total_original": "14000000.00",
      "total_converted": "15000.00",
      "percentage": 52.7
    }
  ],
  "investments": [
    {
      "id": 1,
      "name": "Fondo Mutuo Larraín Vial",
      "asset_type_name": "Fondos Mutuos",
      "asset_type_color": "#6366f1",
      "platform": "Larraín Vial",
      "currency": "CLP",
      "current_amount": "5250000.00",
      "current_amount_converted": "5570.00",
      "target_currency": "USD"
    }
  ]
}
```

> Las inversiones sin registros de valor no aparecen en el resumen.  
> Las inversiones cuya moneda no tiene tipo de cambio disponible se incluyen con `current_amount_converted: 0`.

---

### `GET /portfolio/history`

Retorna una serie temporal diaria del patrimonio total para graficar su evolución.

**Query params:**

| Parámetro | Tipo | Default | Rango | Descripción |
|---|---|---|---|---|
| `currency` | string | `USD` | — | Moneda destino |
| `days` | integer | `90` | 7–365 | Período en días hacia atrás |

**Respuesta `200`:**
```json
{
  "target_currency": "USD",
  "history": [
    {
      "date": "2024-01-01",
      "total_converted": "25000.00",
      "target_currency": "USD"
    },
    {
      "date": "2024-01-02",
      "total_converted": "25150.00",
      "target_currency": "USD"
    }
  ]
}
```

Cada punto representa el patrimonio total al cierre de ese día, usando el tipo de cambio más reciente disponible hasta esa fecha.

---

## Tipos de Cambio — `/exchange-rates`

### `GET /exchange-rates/`

Lista los tipos de cambio almacenados, ordenados por fecha descendente.

**Query params:**

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `base` | string | — | Filtrar por moneda base (ej: `USD`) |

**Respuesta `200`:**
```json
[
  {
    "id": 1,
    "base_currency": "USD",
    "target_currency": "CLP",
    "rate": "950.50000000",
    "date": "2024-03-01"
  }
]
```

---

### `POST /exchange-rates/`

Crea un tipo de cambio manualmente.

**Body:**
```json
{
  "base_currency": "USD",
  "target_currency": "CLP",
  "rate": 950.50,
  "date": "2024-03-01"
}
```

**Respuesta `201`:** objeto creado  
**Error `409`:** ya existe un registro para ese par y esa fecha

---

### `POST /exchange-rates/fetch`

Descarga los tipos de cambio en tiempo real desde [open.er-api.com](https://open.er-api.com) y los almacena en la base de datos. Si ya existe un registro para el par y la fecha actual, lo actualiza.

**Body:**
```json
{
  "base_currency": "USD",
  "target_currencies": ["CLP", "EUR", "ARS"]
}
```

| Campo | Tipo | Default | Descripción |
|---|---|---|---|
| `base_currency` | string | `USD` | Moneda base de la descarga |
| `target_currencies` | array | `null` | Lista de monedas destino. Si es `null`, descarga todas (160+) |

**Respuesta `200`:**
```json
{
  "message": "Stored 160 exchange rates",
  "count": 160
}
```

**Error `502`:** fallo al comunicarse con la API externa

---

## Health — `/health`

### `GET /health`

Verifica que el servidor esté corriendo.

**Respuesta `200`:**
```json
{
  "status": "ok"
}
```

---

## Ejemplos cURL

### Crear un tipo de activo

```bash
curl -X POST http://localhost:8000/asset-types/ \
  -H "Content-Type: application/json" \
  -d '{"name": "ETFs", "slug": "etfs", "color": "#14b8a6", "icon": "bar-chart"}'
```

### Crear una inversión con monto inicial

```bash
curl -X POST http://localhost:8000/investments/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "S&P 500 ETF",
    "asset_type_id": 5,
    "currency": "USD",
    "platform": "Interactive Brokers",
    "initial_amount": 10000,
    "initial_date": "2024-01-01T00:00:00"
  }'
```

### Registrar un nuevo valor

```bash
curl -X POST http://localhost:8000/investments/1/records \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10850,
    "recorded_at": "2024-03-01T00:00:00",
    "note": "+8.5% en el trimestre"
  }'
```

### Ver el resumen del portfolio en CLP

```bash
curl "http://localhost:8000/portfolio/summary?currency=CLP"
```

### Descargar tipos de cambio desde internet

```bash
curl -X POST http://localhost:8000/exchange-rates/fetch \
  -H "Content-Type: application/json" \
  -d '{"base_currency": "USD"}'
```

### Agregar un tipo de cambio manual

```bash
curl -X POST http://localhost:8000/exchange-rates/ \
  -H "Content-Type: application/json" \
  -d '{
    "base_currency": "USD",
    "target_currency": "ARS",
    "rate": 870.50,
    "date": "2024-03-01"
  }'
```

---

## Resolución de tipos de cambio

Cuando se necesita convertir de una moneda A a una moneda B, el sistema intenta en este orden:

1. **Par directo**: busca un registro `A → B`
2. **Par inverso**: busca `B → A` y calcula `1 / tasa`
3. **Puente vía USD**: busca `A → USD` y `USD → B`, multiplica las tasas

Si ninguna opción resuelve la conversión, el monto convertido se reporta como `0`. Para solucionar esto, agregar el tipo de cambio correspondiente ya sea manualmente o descargándolo desde la API externa.

El sistema siempre usa el tipo de cambio más reciente disponible hasta la fecha consultada, lo que permite calcular correctamente el patrimonio histórico.
