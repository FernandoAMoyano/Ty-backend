# Horarios - Reglas de Negocio

> Última actualización: 2026-06-12 | Versión: 2.1

---

## 1. Descripción General

Los horarios definen los días y horas de operación del salón. Cada día de la semana puede tener un horario diferente, y estos se usan para generar los slots de disponibilidad para citas. La entidad Schedule es interna del módulo Appointments — no tiene endpoints propios. La interacción con horarios se realiza a través de `GET /appointments/available-slots`.

---

## 2. Entidades

### Schedule

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| dayOfWeek | DayOfWeekEnum | Día de la semana |
| startTime | string | Hora de apertura (formato HH:MM) |
| endTime | string | Hora de cierre (formato HH:MM) |
| holidayId | UUID? | Horario especial vinculado a un feriado (opcional) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### DayOfWeekEnum

| Valor | Descripción |
|-------|-------------|
| MONDAY | Lunes |
| TUESDAY | Martes |
| WEDNESDAY | Miércoles |
| THURSDAY | Jueves |
| FRIDAY | Viernes |
| SATURDAY | Sábado |
| SUNDAY | Domingo |

---

## 3. Reglas de Negocio

### 3.1 Configuración de Horarios

| Regla | Descripción |
|-------|-------------|
| Por día de semana | Cada día tiene su propio horario |
| Formato de hora | HH:MM en formato 24 horas (regex: `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`) |
| Hora fin > hora inicio | La hora de cierre debe ser posterior a la apertura |
| Duración mínima | El horario debe tener al menos 30 minutos de duración |
| Holiday override | Si tiene `holidayId`, es un horario especial para ese feriado |

### 3.2 Horarios y Feriados

| Regla | Descripción |
|-------|-------------|
| holidayId opcional | Si se define, vincula el horario a un feriado específico |
| ScheduleException | Las excepciones de horario (módulo Holidays) pueden modificar días específicos |

---

## 4. Generación de Slots (GetAvailableSlots)

### 4.1 Validación de Entrada

| Regla | Descripción |
|-------|-------------|
| Fecha requerida | Formato YYYY-MM-DD obligatorio |
| No fechas pasadas | No se puede consultar disponibilidad de fechas anteriores a hoy |
| Máximo 6 meses | No se puede consultar más de 6 meses a futuro |
| Duración mínima | 15 minutos |
| Duración máxima | 480 minutos (8 horas) |
| Incrementos | La duración debe ser en múltiplos de 15 minutos |
| Duración por defecto | 30 minutos si no se especifica |
| stylistId opcional | UUID válido para filtrar por estilista |
| serviceIds opcional | Lista de UUIDs válidos para filtrar por servicios |

### 4.2 Proceso de Generación

```
1. Validar datos de entrada (fecha, duración, IDs)
2. Parsear y validar fecha (no pasada, máximo 6 meses)
3. Determinar día de la semana
4. Obtener Schedule del día → si no existe, retornar día no laboral
5. Generar slots base desde startTime hasta endTime según duración
6. Obtener citas existentes para el día (filtrar por estilista si aplica)
7. Calcular disponibilidad: excluir slots con conflictos de horario
8. Retornar respuesta con slots y metadata
```

### 4.3 Detección de Conflictos

| Regla | Descripción |
|-------|-------------|
| Solapamiento | Un slot está ocupado si su rango se solapa con una cita existente |
| Cálculo | `slotStart < appointmentEnd && slotEnd > appointmentStart` |
| Motivo | Se incluye el motivo del conflicto en la respuesta |

### 4.4 Respuesta

| Campo | Descripción |
|-------|-------------|
| date | Fecha consultada |
| dayOfWeek | Día de la semana |
| isWorkingDay | Si hay horario laboral configurado para el día |
| totalSlots | Total de slots generados |
| availableSlots | Cantidad de slots disponibles |
| slots | Array con cada slot, su disponibilidad y motivo de conflicto |
| workingHours | Hora de inicio y fin del horario laboral |

---

## 5. Endpoint REST

La entidad Schedule no tiene endpoints propios. Se accede a través del módulo Appointments:

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/appointments/available-slots | Obtener slots disponibles | Público |

**Query parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| date | string | Sí | Fecha en formato YYYY-MM-DD |
| duration | number | No | Duración en minutos (default: 30, min: 15, max: 480) |
| stylistId | UUID | No | Filtrar por estilista |
| serviceIds | UUID[] | No | Filtrar por servicios |

---

## 6. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Formato de hora inválido, duración no es múltiplo de 15 |
| 422 | Regla de negocio | Fecha en el pasado, más de 6 meses a futuro |

---

## 7. Relaciones con Otros Módulos

- **Appointments**: Los horarios determinan cuándo se pueden crear citas. GetAvailableSlots es el endpoint público.
- **Holidays**: Los feriados pueden vincular horarios especiales via `holidayId`. Las ScheduleExceptions modifican días específicos.
