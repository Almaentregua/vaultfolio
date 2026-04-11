# Guía de usuario

Esta guía explica cómo usar Vaultfolio para registrar y hacer seguimiento de tus inversiones.

---

## Acceder a la app

Con el backend y el frontend corriendo (ver [instalacion.md](instalacion.md)), abrir el navegador en:

```
http://localhost:5173
```

---

## Flujo recomendado la primera vez

Seguir estos pasos en orden para tener todo configurado correctamente antes de ingresar tus inversiones:

**1. Actualizar tipos de cambio**

Ir a **Tipos de Cambio** en el menú lateral → hacer clic en **Actualizar**.

Esto descarga automáticamente los tipos de cambio actuales desde internet para más de 160 monedas. Es necesario para que el Dashboard pueda convertir tus inversiones a la moneda que elijas.

**2. Revisar los tipos de activo (opcional)**

Ir a **Tipos de Activo**. La app incluye 6 categorías por defecto:

- Fondos Mutuos
- Depósitos a Plazo
- Ahorro en Dólares
- Criptomonedas
- Acciones
- Bienes Raíces

Si tienes otro tipo de inversión no listado (ej: "Préstamos P2P", "ETFs", "Cuenta Remunerada"), agrégalo desde esta sección antes de continuar.

**3. Agregar tus inversiones**

Ir a **Inversiones** → hacer clic en **Nueva inversión**. Completar el formulario para cada posición que tengas.

**4. Ver el Dashboard**

Ir a **Dashboard** → seleccionar la moneda en la que quieres ver tu patrimonio total. Verás el resumen consolidado, la distribución por tipo de activo y el gráfico de evolución.

---

## Dashboard

El Dashboard es la pantalla principal. Muestra una vista consolidada de todo tu patrimonio.

### Selector de moneda

En la esquina superior derecha hay un selector de moneda. Cambiar la moneda convierte automáticamente todos los valores usando los tipos de cambio disponibles. Las opciones incluyen USD, EUR, CLP, ARS, BTC y otras.

### Patrimonio total

El número grande al centro de la pantalla es tu patrimonio neto total, sumando todas las inversiones activas convertidas a la moneda seleccionada.

> Si una inversión no tiene tipo de cambio disponible, su valor aparece como 0 en la suma. Ver la sección de Tipos de Cambio para solucionarlo.

### Gráfico de evolución

Muestra el patrimonio total día a día durante los últimos 90 días. Cada punto del gráfico se calcula tomando el último valor registrado de cada inversión hasta ese día, convertido a la moneda seleccionada.

> El gráfico solo tiene movimiento si has registrado valores históricos en distintas fechas. Con un solo registro por inversión, la línea aparece plana.

### Distribución por tipo de activo

El gráfico de torta muestra qué porcentaje del patrimonio corresponde a cada categoría (Fondos Mutuos, Cripto, etc.), con su porcentaje exacto en la leyenda.

### Tabla de inversiones

Lista todas las inversiones activas ordenadas de mayor a menor valor convertido, mostrando:
- El valor en la moneda original de cada inversión
- El valor convertido a la moneda del Dashboard

---

## Inversiones

### Agregar una inversión

Clic en **Nueva inversión**. Campos del formulario:

| Campo | Obligatorio | Descripción |
|---|---|---|
| Nombre | Sí | Nombre descriptivo. Ej: "Fondo Mutuo Larraín Vial" |
| Tipo de activo | Sí | Categoría. Ej: Fondos Mutuos, Criptomonedas |
| Moneda | Sí | La moneda en que está denominada la inversión. Ej: CLP, USD |
| Plataforma | No | Dónde está depositada. Ej: Fintual, Buda, Banco Estado |
| Monto inicial | No | Si se ingresa, se crea el primer registro de valor automáticamente |
| Notas | No | Cualquier comentario adicional |

### Registrar un nuevo valor

El valor de una inversión se actualiza ingresando un nuevo registro. Hacer clic en el **ícono de gráfico** (trending up) en la fila de la inversión → se abre el formulario de registro:

| Campo | Descripción |
|---|---|
| Monto | Valor actual en la moneda original de la inversión |
| Fecha | Cuándo se tomó el valor (puede ser retroactivo) |
| Nota | Opcional. Ej: "Rentabilidad trimestral +4.2%" |

Se pueden registrar múltiples valores a lo largo del tiempo. El Dashboard y el gráfico siempre usan el registro más reciente como valor actual.

**Ejemplo de uso:**
- Enero: registrar el valor de tu fondo mutuo al final del mes
- Febrero: registrar el nuevo valor (con rendimiento o sin él)
- El gráfico mostrará la evolución entre ambas fechas

### Estado de una inversión

Las inversiones pueden estar **activas** o **inactivas**. Solo las activas aparecen en el Dashboard. Para marcar una inversión como inactiva (por ejemplo, si ya la liquidaste pero quieres conservar el historial), editar la inversión y desmarcar el campo `is_active`. Por ahora esta acción se hace directamente desde la API en `/docs`.

### Eliminar una inversión

Hacer clic en el **ícono de papelera** en la fila de la inversión. Se pedirá confirmación. Al eliminar, se borran también todos los registros históricos asociados (esta acción no se puede deshacer).

---

## Tipos de Activo

### Ver categorías existentes

La pantalla muestra una grilla con todas las categorías, incluyendo su color identificador y la cantidad de inversiones activas de cada una.

### Agregar una categoría nueva

Clic en **Nuevo tipo** y completar:

| Campo | Descripción |
|---|---|
| Nombre | Nombre visible en la UI. Ej: "Cuenta Remunerada" |
| Slug | Se genera automáticamente a partir del nombre. Es el identificador interno. |
| Descripción | Opcional, aparece en la tarjeta |
| Color | El color del badge en la UI. Elegir de los 8 presets o ingresar un color personalizado. |

### Editar una categoría

Hacer clic en el **ícono de lápiz** en la tarjeta del tipo. Se puede cambiar el nombre, descripción y color (no el slug).

### Eliminar una categoría

Hacer clic en el **ícono de papelera**. Solo se puede eliminar si no tiene inversiones asociadas (activas o inactivas). Si tiene inversiones, primero hay que eliminarlas o reasignarlas a otra categoría.

---

## Tipos de Cambio

Los tipos de cambio permiten convertir inversiones en distintas monedas al mismo valor de referencia en el Dashboard.

### Actualizar automáticamente

Seleccionar la **moneda base** en el selector (generalmente USD) y hacer clic en **Actualizar**. Esto descarga los tipos de cambio actuales desde internet para todas las monedas disponibles (más de 160).

Repetir este proceso periódicamente (semanal o mensualmente) para mantener los valores actualizados.

> Se requiere conexión a internet. Si hay un error de red, aparecerá un mensaje indicándolo.

### Agregar una tasa manual

Útil para monedas no disponibles en la API (como tipos de cambio informales o cripto):

1. Clic en **Agregar manual**
2. Ingresar moneda base, moneda destino, la tasa y la fecha
3. Guardar

**Ejemplo:** Si 1 USD = 950 CLP, la tasa a ingresar es `950` con base `USD` y destino `CLP`.

### Filtrar

Usar el selector "Filtrar por base" para ver solo los tipos de cambio de una moneda específica.

---

## Preguntas frecuentes

**¿Qué pasa si no hay tipo de cambio para una de mis monedas?**

La conversión de esa inversión aparece como 0 en el Dashboard, lo que hace que el patrimonio total sea incorrecto. La solución es agregar el tipo de cambio correspondiente (automáticamente o de forma manual).

**¿Cómo ve el sistema el "valor actual" de una inversión?**

Toma el registro más reciente (por fecha) de todos los que hayas ingresado para esa inversión. Si no tiene ningún registro, no aparece en el Dashboard.

**¿Puedo ingresar valores históricos con fecha retroactiva?**

Sí. Al agregar un registro, la fecha es editable. Esto permite cargar el historial completo de una inversión con fechas pasadas.

**¿Los datos se guardan en la nube?**

No. Vaultfolio es una app local. Todos los datos se guardan en el archivo `backend/vaultfolio.db` en tu computador.

**¿Cómo hago un backup de mis datos?**

Copiar el archivo `backend/vaultfolio.db` a otra ubicación (disco externo, servicio de nube, etc.).

```bash
cp backend/vaultfolio.db ~/Desktop/vaultfolio-backup-$(date +%Y%m%d).db
```

**¿Qué pasa si cierro el navegador?**

Los datos están guardados en la base de datos local. Al volver a abrir la app (con el backend corriendo), todo sigue igual.

**¿Puedo usar la app sin conexión a internet?**

Sí, con excepción de la función "Actualizar" de los tipos de cambio, que requiere internet para descargar las tasas actuales. Todo lo demás funciona offline.

**¿Cómo agrego una moneda que no aparece en el selector?**

Las monedas disponibles en los selectores de la UI están definidas en `frontend/src/types/index.ts`. Para agregar una, editar el array `COMMON_CURRENCIES` y reiniciar el frontend. Ver [desarrollo.md](desarrollo.md) para más detalles.
