# Vaultfolio — Agent Guidelines

## Stack
- **Backend**: FastAPI + SQLAlchemy + Alembic (PostgreSQL)
- **Frontend**: React + TypeScript + Vite + Recharts
- **Auth**: none (personal tool)

---

## Cambios con impacto en base de datos

Antes de aplicar cualquier cambio, determinar su tipo:

| Tipo | Descripción |
|------|-------------|
| `safe` | Solo lógica o UI, sin tocar modelos ni tablas |
| `schema` | Modifica estructura de tablas (columnas, tipos, constraints, relaciones) |
| `data` | Requiere migración o transformación de datos existentes |

### Cuándo advertir explícitamente

Advertir si el cambio incluye cualquiera de estos:
- Agregar/eliminar columnas
- Cambiar tipos de datos o constraints (`NOT NULL`, `UNIQUE`, etc.)
- Renombrar columnas o tablas
- Modificar relaciones (FK, PK)
- Eliminar o transformar datos existentes

### Checklist previo (tipo `schema` o `data`)

- [ ] ¿Qué tablas se ven afectadas?
- [ ] ¿Hay pérdida potencial de datos?
- [ ] ¿Se necesita migración Alembic?
- [ ] ¿Es backward compatible con datos existentes?
- [ ] ¿Se puede hacer rollback sin pérdida?

### Acciones requeridas

1. Indicar el tipo de cambio (`schema` / `data`)
2. Listar las tablas afectadas
3. Especificar si se requiere migración Alembic y su estrategia
4. Señalar si hay riesgo de pérdida de datos
5. Sugerir validaciones post-migración
6. Si hay riesgo alto, proponer estrategia de rollback
