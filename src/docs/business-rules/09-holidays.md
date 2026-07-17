# Feriados y Excepciones de Horario - Reglas de Negocio

> Última actualización: 2026-06-27 | Versión: 3.0

---

## 1. Descripción General

El módulo de feriados gestiona los días especiales donde el salón puede tener operaciones modificadas o estar cerrado. Incluye feriados (días especiales) y excepciones de horario (modificaciones puntuales al horario regular).

---

## 2. Entidades

### Holiday (Feriado)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre del feriado (requerido) |
| date | Date | Fecha del feriado (requerido) |
| description | string? | Descripción opcional |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### ScheduleException (Excepción de Horario)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| exceptionDate | Date | Fecha de la excepción (requerido) |
| startTimeException | string | Hora de inicio HH:MM (requerido) |
| endTimeException | string | Hora de fin HH:MM (requerido) |
| reason | string? | Razón de la excepción |
| holidayId | UUID? | ID del feriado asociado (opcional) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

---

## 3. Permisos por Rol

| Acción | Público | CLIENT | STYLIST | ADMIN |
|--------|---------|--------|---------|-------|
| Consultar feriados | ✅ | ✅ | ✅ | ✅ |
| Consultar excepciones | ✅ | ✅ | ✅ | ✅ |
| Verificar si fecha es feriado | ✅ | ✅ | ✅ | ✅ |
| Crear feriado | ❌ | ❌ | ❌ | ✅ |
| Actualizar feriado | ❌ | ❌ | ❌ | ✅ |
| Eliminar feriado | ❌ | ❌ | ❌ | ✅ |
| Crear excepción | ❌ | ❌ | ❌ | ✅ |
| Actualizar excepción | ❌ | ❌ | ❌ | ✅ |
| Eliminar excepción | ❌ | ❌ | ❌ | ✅ |

---

## 4. Reglas de Negocio

### 4.1 Creación de Feriados

| Regla | Descripción |
|-------|-------------|
| Nombre requerido | No puede estar vacío, máximo 100 caracteres, se trimea al guardar |
| Fecha requerida | La fecha debe estar en formato ISO 8601 (YYYY-MM-DD) |
| Fechas pasadas permitidas | Se permite crear feriados para fechas pasadas para mantener un registro histórico. Las propiedades computadas `isPast`, `isToday` y `isFuture` permiten filtrar según necesidad |
| Unicidad de fecha | No pueden existir dos feriados en la misma fecha |
| Descripción opcional | Puede ser null o string, máximo 500 caracteres, se trimea al guardar |
| Auto-cancel de citas | Al crear un feriado, se cancelan automáticamente todas las citas activas (PENDING/CONFIRMED) para esa fecha. Las citas se marcan con `cancellationReason: 'Holiday created'` y `cancelledBy: 'system'`. La cancelación es silenciosa (no se reporta en el response) |

### 4.2 Creación de Excepciones

| Regla | Descripción |
|-------|-------------|
| Fecha requerida | La fecha debe estar en formato ISO 8601 |
| Fechas pasadas permitidas | Se permite crear excepciones para fechas pasadas para mantener un registro histórico |
| Horarios requeridos | startTimeException y endTimeException en formato HH:MM |
| Formato de hora válido | Regex `^([01]?[0-9]|2[0-3]):[0-5][0-9]$` |
| Hora fin > hora inicio | La hora de fin debe ser posterior a la hora de inicio |
| Unicidad de fecha | No pueden existir dos excepciones en la misma fecha |
| HolidayId válido | Si se proporciona holidayId, el feriado debe existir |
| Razón opcional | Máximo 500 caracteres, se trimea al guardar |

### 4.3 Actualización

| Regla | Descripción |
|-------|-------------|
| Parcial | Se pueden actualizar campos individuales |
| Unicidad de fecha | Si se cambia la fecha, debe seguir siendo única |
| Mismas validaciones | Nombre, descripción, horarios y razón deben cumplir las mismas reglas de formato y longitud que en creación |

### 4.4 Eliminación

| Regla | Descripción |
|-------|-------------|
| Cascada | Al eliminar un feriado, se eliminan sus excepciones asociadas |
| Desvinculación de Schedules (F9) | Los `Schedule` que referencian el feriado quedan con `holidayId = null` (FK `onDelete: SetNull`), no se borran |
| Irreversible | La eliminación es permanente |

### 4.5 Feriados sin Excepción de Horario

| Regla | Descripción |
|-------|-------------|
| Día cerrado por defecto | Un feriado sin excepción de horario asociada se interpreta como día cerrado (sin disponibilidad) |
| Horario especial | Si el salón opera en un feriado con horario especial, se debe crear una `ScheduleException` vinculada al feriado |

---

## 5. Propiedades Computadas

### Holiday

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| year | number | Año del feriado |
| month | number | Mes del feriado (1-12) |
| day | number | Día del mes |
| isPast | boolean | Si el feriado ya pasó |
| isToday | boolean | Si el feriado es hoy |
| isFuture | boolean | Si el feriado es futuro |

### ScheduleException

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| isHolidayRelated | boolean | Si está asociada a un feriado |
| durationInMinutes | number | Duración en minutos |
| isPast | boolean | Si la excepción ya pasó |
| isToday | boolean | Si la excepción es hoy |
| isFuture | boolean | Si la excepción es futura |

---

## 6. Endpoints REST

### Holidays (Feriados)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/holidays | Listar feriados paginados | Público |
| GET | /api/v1/holidays/:id | Obtener feriado por ID | Público |
| GET | /api/v1/holidays/upcoming | Próximos feriados | Público |
| GET | /api/v1/holidays/year/:year | Feriados por año | Público |
| GET | /api/v1/holidays/check/:date | Verificar si es feriado | Público |
| POST | /api/v1/holidays | Crear feriado | Admin |
| PUT | /api/v1/holidays/:id | Actualizar feriado | Admin |
| DELETE | /api/v1/holidays/:id | Eliminar feriado | Admin |

### Schedule Exceptions (Excepciones)

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/holidays/exceptions | Listar excepciones | Público |
| GET | /api/v1/holidays/exceptions/:id | Obtener por ID | Público |
| GET | /api/v1/holidays/exceptions/upcoming | Próximas excepciones | Público |
| GET | /api/v1/holidays/:holidayId/exceptions | Excepciones de un feriado | Público |
| POST | /api/v1/holidays/exceptions | Crear excepción | Admin |
| PUT | /api/v1/holidays/exceptions/:id | Actualizar excepción | Admin |
| DELETE | /api/v1/holidays/exceptions/:id | Eliminar excepción | Admin |

---

## 7. Filtros y Paginación

### Holidays

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Elementos por página (default: 10, max: 100) |
| year | number | Filtrar por año (2000-2100) |
| month | number | Filtrar por mes (1-12) |
| name | string | Filtrar por nombre (búsqueda parcial) |
| startDate | date | Fecha inicio del rango |
| endDate | date | Fecha fin del rango |

### Schedule Exceptions

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Elementos por página (default: 10, max: 100) |
| startDate | date | Fecha inicio del rango |
| endDate | date | Fecha fin del rango |
| holidayId | UUID | Filtrar por feriado asociado |
| reason | string | Filtrar por razón (búsqueda parcial) |

> **Nota (ISSUE-26):** El default de `limit` es 10 tanto para Holidays como para ScheduleExceptions, por menor volumen esperado de datos. Otros módulos como Payments y Notifications usan 20.

---

## 8. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación de entrada | Formato de hora inválido, UUID inválido |
| 401 | No autenticado | Token faltante o inválido |
| 403 | Sin permisos | No-admin intentando crear, actualizar o eliminar |
| 404 | No encontrado | Feriado o excepción no existe |
| 409 | Conflicto | Ya existe feriado/excepción en esa fecha |

---

## 9. Relaciones con Otros Módulos

- **Appointments**: Los feriados afectan la disponibilidad de citas a través de `ScheduleAvailabilityService`. Un feriado sin excepción cierra el día (no se pueden crear citas ni se muestran slots). Al crear un feriado, se cancelan automáticamente las citas activas para esa fecha vía `CreateHoliday` use case
- **Schedules**: Las excepciones de horario (`ScheduleException`) actúan como modificadores temporales de los `Schedule` regulares. En una fecha con excepción, el horario de la excepción prevalece sobre el horario regular. La prioridad completa es: `ScheduleException > Holiday (cerrado) > Schedule regular`. Además, `Schedule.holidayId` es una FK opcional hacia `Holiday` con `onDelete: SetNull` (F9): si el feriado referenciado se elimina, el `Schedule` no se borra, solo pierde la referencia (`holidayId` pasa a `null`)

---

## 10. Decisiones de Diseño

| Decisión | Descripción |
|----------|-------------|
| Fechas pasadas permitidas (ISSUE-23) | Se permite crear feriados y excepciones para fechas pasadas para mantener un registro histórico. Las propiedades computadas `isPast`, `isToday` y `isFuture` permiten filtrar según necesidad |
| Feriado sin excepción = cerrado (ISSUE-22) | Un feriado sin excepción de horario asociada se interpreta como día cerrado. Si el salón opera ese día, se debe crear una ScheduleException vinculada |

---

## 11. Limitaciones Conocidas

| ID | Descripción |
|----|-------------|
| ISSUE-23 | No hay validación que impida crear feriados o excepciones para fechas pasadas. Es intencional para mantener registro histórico |

> Los issues ISSUE-12 e ISSUE-21 fueron resueltos en el plan de intervención v3.
