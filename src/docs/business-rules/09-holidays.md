# Feriados y Excepciones de Horario - Reglas de Negocio

> Última actualización: 2026-06-12 | Versión: 2.1

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
| Unicidad de fecha | No pueden existir dos feriados en la misma fecha |
| Descripción opcional | Puede ser null o string, máximo 500 caracteres, se trimea al guardar |

### 4.2 Creación de Excepciones

| Regla | Descripción |
|-------|-------------|
| Fecha requerida | La fecha debe estar en formato ISO 8601 |
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
| Irreversible | La eliminación es permanente |

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

### Con Appointments

Los feriados y excepciones de horario afectan la disponibilidad de citas:

- El sistema de disponibilidad debería consultar `CheckIsHoliday` antes de ofrecer slots
- Las excepciones de horario modifican los horarios regulares para fechas específicas
- Esta integración debe implementarse en el módulo de Appointments

### Con Schedules

- Las excepciones de horario (`ScheduleException`) actúan como modificadores temporales de los `Schedule` regulares
- En una fecha con excepción, el horario de la excepción prevalece sobre el horario regular
