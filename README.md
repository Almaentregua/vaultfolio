# Vaultfolio

Tracker personal de inversiones con soporte multi-moneda y seguimiento histórico de patrimonio.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?style=flat&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/Licencia-MIT-green?style=flat)

---

## ¿Qué es Vaultfolio?

Vaultfolio es una aplicación web personal para registrar y visualizar el capital distribuido en distintas plataformas y tipos de activos. Permite cargar el valor de cada inversión en su moneda original (CLP, ARS, USD, EUR, BTC, etc.) y convertir automáticamente el patrimonio total a cualquier moneda de referencia usando tipos de cambio actualizables.

---

## Funcionalidades

- **Registro de inversiones** — nombre, plataforma, tipo de activo y moneda
- **Historial de valores** — snapshots en el tiempo por inversión para seguimiento de rendimiento
- **Dashboard consolidado** — patrimonio neto total convertido a la moneda que elijas
- **Gráfico de evolución** — línea de patrimonio acumulado de los últimos 90 días
- **Desglose visual** — distribución del portfolio por tipo de activo y por moneda
- **Tipos de activo configurables** — agrega categorías nuevas desde la UI sin tocar código
- **Tipos de cambio** — descarga automática desde internet o ingreso manual
- **Multi-moneda** — resolución automática de pares (directo, inverso o vía USD)

---

## Stack tecnológico

### Backend

| Tecnología | Versión | Función |
|---|---|---|
| Python | ≥ 3.11 | Lenguaje principal |
| FastAPI | ≥ 0.111 | Framework web, API REST |
| SQLAlchemy | ≥ 2.0 | ORM con tipado moderno |
| SQLite | — | Base de datos local (archivo único) |
| Pydantic v2 | ≥ 2.7 | Validación de datos y schemas |
| httpx | ≥ 0.27 | Cliente HTTP para descargar tipos de cambio |
| Uvicorn | ≥ 0.30 | Servidor ASGI |

### Frontend

| Tecnología | Versión | Función |
|---|---|---|
| React | 18 | UI declarativa con componentes |
| TypeScript | 5.5 | Tipado estático |
| Vite | 5 | Build tool y dev server |
| TanStack Query | 5 | Gestión de estado del servidor, caché |
| Recharts | 2 | Gráficos de línea y pie |
| Tailwind CSS | 3 | Estilos utility-first |
| Radix UI | — | Primitivas de UI accesibles |
| Axios | 1.7 | Cliente HTTP |

### API de tipos de cambio

[open.er-api.com](https://www.exchangerate-api.com/docs/free) — gratuita, sin API key, más de 160 monedas incluyendo CLP y ARS.

---

## Prerequisitos

- **Python** ≥ 3.11 — `python3 --version`
- **Node.js** ≥ 18 — `node --version`
- **npm** ≥ 9 — `npm --version`

---

## Inicio rápido

```bash
# 1. Instalar dependencias
make install

# 2. Configurar el backend
cp backend/.env.example backend/.env

# 3. Terminal A — iniciar el backend (puerto 8000)
make dev-backend

# 4. Terminal B — iniciar el frontend (puerto 5173)
make dev-frontend
```

Abrir [http://localhost:5173](http://localhost:5173) en el navegador.

> El primer arranque del backend crea la base de datos SQLite y carga 6 tipos de activo por defecto.

Para instalación detallada ver [docs/instalacion.md](docs/instalacion.md).

---

## Estructura del proyecto

```
vaultfolio/
├── backend/                        # API REST en Python
│   ├── app/
│   │   ├── main.py                 # Punto de entrada FastAPI, CORS, lifespan
│   │   ├── config.py               # Variables de entorno (Settings)
│   │   ├── database.py             # Motor SQLAlchemy y sesión
│   │   ├── seeds.py                # Datos iniciales (6 tipos de activo)
│   │   ├── models/                 # Modelos ORM (tablas de la BD)
│   │   │   ├── asset_type.py       # Tipos de activo (Fondos Mutuos, Cripto, etc.)
│   │   │   ├── investment.py       # Inversiones
│   │   │   ├── investment_record.py # Historial de valores por inversión
│   │   │   └── exchange_rate.py    # Tipos de cambio almacenados
│   │   ├── schemas/                # Schemas Pydantic (request / response)
│   │   │   ├── asset_type.py
│   │   │   ├── investment.py
│   │   │   ├── exchange_rate.py
│   │   │   └── portfolio.py
│   │   ├── routers/                # Endpoints agrupados por recurso
│   │   │   ├── asset_types.py      # CRUD /asset-types
│   │   │   ├── investments.py      # CRUD /investments + /records
│   │   │   ├── portfolio.py        # /portfolio/summary y /history
│   │   │   └── exchange_rates.py   # CRUD + fetch /exchange-rates
│   │   └── services/               # Lógica de negocio desacoplada
│   │       ├── portfolio.py        # Cálculo de patrimonio y serie histórica
│   │       └── exchange_rate.py    # Resolución de tasas y descarga externa
│   ├── .env.example                # Plantilla de variables de entorno
│   └── pyproject.toml              # Dependencias y metadata del proyecto
│
├── frontend/                       # Interfaz web en React + TypeScript
│   ├── src/
│   │   ├── types/index.ts          # Contratos TypeScript de todas las entidades
│   │   ├── services/api.ts         # Funciones tipadas para cada endpoint
│   │   ├── lib/utils.ts            # Helpers: formatCurrency, formatDate, cn()
│   │   ├── components/
│   │   │   └── Layout.tsx          # Sidebar de navegación + contenedor principal
│   │   └── pages/
│   │       ├── Dashboard.tsx       # Resumen de patrimonio, gráficos
│   │       ├── Investments.tsx     # Lista y gestión de inversiones
│   │       ├── AssetTypes.tsx      # Configuración de tipos de activo
│   │       └── ExchangeRates.tsx   # Gestión de tipos de cambio
│   ├── index.html
│   ├── vite.config.ts              # Proxy /api → backend, alias @/
│   ├── tailwind.config.ts
│   └── package.json
│
├── docs/                           # Documentación detallada
│   ├── instalacion.md              # Guía de instalación paso a paso
│   ├── api.md                      # Referencia completa de la API REST
│   ├── desarrollo.md               # Arquitectura y guía para extender la app
│   └── usuario.md                  # Guía de uso de la interfaz
│
├── Makefile                        # Comandos de desarrollo
└── .gitignore
```

---

## Variables de entorno

El backend se configura mediante un archivo `.env` en la carpeta `backend/`. Copiar `.env.example` como punto de partida.

| Variable | Default | Descripción |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./vaultfolio.db` | URL de conexión a la base de datos. Con SQLite el archivo se crea automáticamente. |
| `DEFAULT_CURRENCY` | `USD` | Moneda por defecto (uso referencial, no afecta la lógica actual). |
| `EXCHANGE_RATE_API_URL` | `https://open.er-api.com/v6/latest` | URL base de la API de tipos de cambio. |

El frontend no requiere variables de entorno. Se comunica con el backend a través del proxy de Vite.

---

## Comandos disponibles

```bash
make install          # Instala backend y frontend
make install-backend  # Solo backend (crea venv + pip install)
make install-frontend # Solo frontend (npm install)
make dev-backend      # Inicia el servidor FastAPI en :8000 con recarga automática
make dev-frontend     # Inicia Vite en :5173
```

---

## Documentación

| Documento | Contenido |
|---|---|
| [docs/instalacion.md](docs/instalacion.md) | Instalación detallada, configuración, troubleshooting |
| [docs/api.md](docs/api.md) | Referencia completa de todos los endpoints REST |
| [docs/desarrollo.md](docs/desarrollo.md) | Arquitectura, convenciones y cómo extender la app |
| [docs/usuario.md](docs/usuario.md) | Guía de uso de la interfaz web |

La API también tiene documentación interactiva generada automáticamente en [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) cuando el backend está corriendo.

---

## Licencia

MIT — ver [LICENSE](LICENSE) para más detalles.
