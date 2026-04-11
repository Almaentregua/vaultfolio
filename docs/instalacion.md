# Instalación y configuración

Esta guía explica cómo instalar y poner en marcha Vaultfolio en un entorno local de desarrollo.

---

## Prerequisitos

Verificar que las siguientes herramientas estén instaladas:

| Herramienta | Versión mínima | Verificar |
|---|---|---|
| Python | 3.11 | `python --version` |
| pip | 23+ | `pip --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |

Si no están instaladas:
- Python: [python.org/downloads](https://www.python.org/downloads/)
- Node.js: [nodejs.org](https://nodejs.org/) (incluye npm)

---

## Obtener el proyecto

```bash
git clone <url-del-repositorio>
cd vaultfolio
```

---

## Backend

### 1. Crear y activar el entorno virtual

El entorno virtual aísla las dependencias del proyecto del sistema.

**Linux / macOS:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Al activarse, el prompt de la terminal muestra `(.venv)` al inicio.

### 2. Instalar dependencias

```bash
pip install -e "."
```

El flag `-e` instala el proyecto en modo editable. Las dependencias que se instalan son:

- `fastapi` — framework web
- `uvicorn[standard]` — servidor ASGI con extras (websockets, watchfiles para reload)
- `sqlalchemy` — ORM
- `pydantic` + `pydantic-settings` — validación y configuración
- `httpx` — cliente HTTP para descargar tipos de cambio
- `python-dotenv` — carga de variables de entorno

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` generado tiene los valores por defecto listos para desarrollo local. Para personalizarlos, editar el archivo:

```bash
# .env
DATABASE_URL=sqlite:///./vaultfolio.db   # Ruta al archivo SQLite
DEFAULT_CURRENCY=USD                      # Moneda de referencia (informativo)
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest
```

> No se necesitan API keys ni servicios externos para que la app funcione. Los tipos de cambio son opcionales.

### 4. Iniciar el servidor

```bash
# Desde la carpeta backend/, con el venv activado
uvicorn app.main:app --reload --port 8000
```

O usando el Makefile desde la raíz del proyecto:

```bash
make dev-backend
```

**¿Qué ocurre al primer arranque?**

1. FastAPI inicializa la aplicación
2. SQLAlchemy crea el archivo `vaultfolio.db` con todas las tablas
3. Se insertan 6 tipos de activo por defecto (Fondos Mutuos, Depósitos a Plazo, Ahorro en Dólares, Criptomonedas, Acciones, Bienes Raíces)
4. El servidor queda escuchando en `http://localhost:8000`

### 5. Verificar que funciona

Abrir en el navegador:
- **Swagger UI** (documentación interactiva): [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health check**: [http://localhost:8000/health](http://localhost:8000/health) → debe retornar `{"status": "ok"}`

---

## Frontend

### 1. Instalar dependencias

```bash
cd frontend   # (desde la raíz del proyecto)
npm install
```

Esto instala React, TypeScript, Vite, TanStack Query, Recharts, Tailwind CSS y el resto de dependencias declaradas en `package.json`.

### 2. Iniciar el servidor de desarrollo

```bash
npm run dev
```

O usando el Makefile:

```bash
make dev-frontend
```

Vite inicia en `http://localhost:5173`.

> El frontend **no necesita archivo `.env`**. Se comunica con el backend a través del proxy configurado en `vite.config.ts`: cualquier petición a `/api/*` se reenvía automáticamente a `http://localhost:8000/*`, eliminando el prefijo `/api`.

### 3. Verificar que funciona

Abrir [http://localhost:5173](http://localhost:5173). Si el backend está corriendo, el Dashboard debe cargar (vacío al principio).

---

## Uso con Makefile

El `Makefile` en la raíz del proyecto define atajos para las operaciones más comunes:

| Comando | Equivalente | Descripción |
|---|---|---|
| `make install` | — | Instala backend y frontend |
| `make install-backend` | `cd backend && python -m venv .venv && .venv/bin/pip install -e ".[dev]"` | Solo backend |
| `make install-frontend` | `cd frontend && npm install` | Solo frontend |
| `make dev-backend` | `cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000` | Inicia API |
| `make dev-frontend` | `cd frontend && npm run dev` | Inicia UI |

### Scripts npm disponibles

```bash
npm run dev      # Inicia Vite con HMR en localhost:5173
npm run build    # Compila TypeScript + construye bundle de producción
npm run preview  # Previsualiza el build de producción localmente
```

---

## Errores comunes

### Puerto ya en uso

**Síntoma:** `ERROR: [Errno 98] Address already in use`

**Solución:** Cambiar el puerto o terminar el proceso que lo ocupa.

```bash
# Buscar qué proceso usa el puerto 8000
lsof -i :8000

# Usar un puerto alternativo
uvicorn app.main:app --reload --port 8001
```

Si se cambia el puerto del backend, actualizar el proxy en `frontend/vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8001',  // cambiar aquí
    ...
  }
}
```

---

### Error de CORS al hacer peticiones desde el frontend

**Síntoma:** Error en consola del navegador: `Access to XMLHttpRequest at 'http://localhost:8000/...' has been blocked by CORS policy`

**Causa:** El frontend está intentando llamar directamente al backend en lugar de usar el proxy de Vite.

**Solución:** Verificar que `axios` en `src/services/api.ts` use `baseURL: '/api'` (ruta relativa, no absoluta).

---

### La base de datos está corrupta o se quiere empezar de cero

El archivo `vaultfolio.db` se encuentra en `backend/vaultfolio.db`.

```bash
# Detener el backend primero, luego:
rm backend/vaultfolio.db

# Al volver a iniciar el backend, se recreará desde cero
make dev-backend
```

> Esto borra todos los datos. Para hacer un backup antes, copiar el archivo a otra ubicación.

---

### `ModuleNotFoundError` al iniciar el backend

**Causa:** El entorno virtual no está activado o las dependencias no se instalaron.

```bash
cd backend
source .venv/bin/activate   # activar venv
pip install -e "."           # reinstalar si es necesario
```

---

### `npm: command not found`

Node.js no está instalado. Descargar desde [nodejs.org](https://nodejs.org/) e instalar la versión LTS.
