# Citas (Appointments) - Reglas de Negocio

> Última actualización: 2026-06-27 | Versión: 3.0

---

## 1. Descripción General

El módulo de citas es el núcleo del sistema. Gestiona las reservas de servicios por parte de los clientes, incluyendo creación, confirmación, cancelación y seguimiento del estado de cada cita.

---

## 2. Entidades

### Appointment

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| dateTime | DateTime | Fecha y hora de la cita |
| duration | number | Duración total en minutos (15-480, múltiplos de 15) |
| userId | UUID | Usuario que creó la cita |
| clientId | UUID | Cliente asociado a la cita |
| scheduleId | UUID | Horario del día asociado |
| statusId | UUID | Referencia al estado actual (AppointmentStatus) |
| stylistId | UUID? | Estilista asignado (opcional) |
| confirmedAt | DateTime? | Fecha de confirmación (null si no confirmada) |
| serviceIds | string[] | Lista de IDs de servicios incluidos |
| cancellationReason | string? | Razón de cancelación (máx 500 caracteres) |
| cancelledBy | string? | Tipo de cancelación: client, stylist, admin, system |
| confirmationNotes | string? | Notas de confirmación (máx 500 caracteres) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### AppointmentStatus

Entidad completa con métodos de negocio, no solo un enum.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre del estado (máx 50 caracteres) |
| description | string? | Descripción del estado (máx 200 caracteres) |

**Valores del enum AppointmentStatusEnum:**

| Estado | Descripción |
|--------|-------------|
| PENDING | Pendiente de confirmación |
| CONFIRMED | Confirmada |
| IN_PROGRESS | En progreso |
| COMPLETED | Completada |
| CANCELLED | Cancelada |
| NO_SHOW | Cliente no se presentó |

**Métodos de negocio:**
- `isTerminalStatus()` — Retorna `true` si el estado es COMPLETED, CANCELLED o NO_SHOW
- `canTransitionTo(newStatus)` — Valida si la transición de estado es permitida

---

## 3. Permisos

El modelo de permisos de este módulo es **ownership-based** (basado en participación), no role-based. Las acciones de mutación dependen de la relación del usuario con la cita, no de su rol.

### 3.1 Acciones públicas

| Acción | Acceso |
|--------|--------|
| Ver slots disponibles | Público (sin autenticación) |

### 3.2 Acciones de consulta

Todas las rutas de consulta requieren solo `authenticate` (sin `authorize`). Cualquier usuario autenticado puede acceder, independientemente de su rol.

| Acción | ADMIN | STYLIST | CLIENT |
|--------|-------|---------|--------|
| Ver cita por ID | ✅ | ✅ | ✅ |
| Ver citas por cliente | ✅ | ✅ | ✅ |
| Ver citas por estilista | ✅ | ✅ | ✅ |

### 3.3 Acciones de mutación (ownership-based)

| Acción | ¿Quién puede? | Validación en código |
|--------|--------------|---------------------|
| Crear cita | Cualquier autenticado | Solo `authenticate` |
| Confirmar cita | El creador (`userId`) o el estilista asignado (`stylistId`) | `ConfirmAppointment` valida participación |
| Cancelar cita | El creador (`userId`), cliente (`clientId`), o estilista (`stylistId`) | `CancelAppointment` valida participación |
| Actualizar cita | Cualquier autenticado | Solo `authenticate` |

> **Nota:** ADMIN tiene override de autorización: puede confirmar/cancelar cualquier cita sin necesidad de ser participante. Los demás roles requieren ser participantes de la cita (userId, clientId o stylistId).

---

## 4. Reglas de Negocio

### 4.1 Creación de Citas

| Regla | Descripción |
|-------|-------------|
| Fecha futura | No se pueden crear citas en el pasado (validación solo en `create()`, no en `fromPersistence()`) |
| Límite futuro | Máximo 6 meses de anticipación |
| Servicio requerido | Al menos un `serviceId` debe proporcionarse |
| Servicios activos | Todos los servicios deben tener `isActive = true`. Se lanza `BusinessRuleError` si algún servicio está inactivo |
| Estilista ofrece servicios | Si se especifica `stylistId`, el estilista debe tener asignado cada servicio (`IStylistServiceRepository.findByStylistAndService`) y estar ofreciéndolo (`isOffering = true`) |
| Cliente válido | El `clientId` del DTO es siempre el `User.id` (el ID que el frontend conoce tras login). El use case busca el Client vía `findByUserId()` y lanza `NotFoundError` si no existe |
| Estilista válido | Si se especifica, el `stylistId` debe existir |
| Día laboral | El día debe tener horario efectivo (determinado por `ScheduleAvailabilityService`) |
| Horario laboral | La hora de la cita debe caer dentro del rango `startTime`-`endTime` del horario efectivo. La cita completa (inicio + duración) debe terminar antes de `endTime` |
| Sin conflictos | No debe haber citas superpuestas en el mismo horario (validado por `findConflictingAppointments`) |
| Límite diario | Máximo 3 citas activas (no canceladas) por cliente por día. Se valida con `findByClientAndDateRange` excluyendo estado CANCELLED |
| Disponibilidad del día | Se consulta `ScheduleAvailabilityService.getEffectiveSchedule()` para determinar el horario efectivo del día. Si retorna `null`, el día está cerrado |
| Estado inicial | Se crea con estado PENDING |
| Duración auto-calculada | Si no se proporciona `duration`, se calcula sumando la duración de los servicios seleccionados (mínimo 15 min) |

### 4.2 Duración de Citas

| Regla | Valor |
|-------|-------|
| Duración mínima | 15 minutos |
| Duración máxima | 480 minutos (8 horas) |
| Incrementos | Múltiplos de 15 minutos |
| Cálculo automático | Si no se especifica, suma duración de servicios seleccionados |

### 4.3 Confirmación de Citas

| Regla | Descripción |
|-------|-------------|
| Estado requerido | Solo citas en estado PENDING pueden confirmarse (validado vía `canTransitionTo()`) |
| No ya confirmada | Si `confirmedAt` ya tiene valor, no se puede confirmar de nuevo |
| No cancelada | No se pueden confirmar citas con estado CANCELLED |
| No completada | No se pueden confirmar citas con estado COMPLETED |
| No en el pasado | No se pueden confirmar citas que ya pasaron |
| Tiempo mínimo | Debe confirmarse al menos **1 hora antes** de la cita |
| Permisos | El creador (`userId`) o el estilista asignado (`stylistId`) pueden confirmar |
| Registro | Se guarda `confirmedAt` con la fecha de confirmación |
| Notas | Opcionales, máximo 500 caracteres. Se almacenan en `confirmationNotes` |

### 4.4 Cancelación de Citas

| Regla | Descripción |
|-------|-------------|
| No cancelada | No se pueden cancelar citas ya CANCELLED |
| No completada | No se pueden cancelar citas COMPLETED |
| No en el pasado | No se pueden cancelar citas que ya pasaron |
| Tiempo mínimo | Debe cancelarse al menos **2 horas antes** de la cita |
| Permisos | El creador (`userId`), cliente (`clientId`), estilista asignado (`stylistId`) pueden cancelar |
| Transición válida | Validada vía `canTransitionTo()` |
| Razón opcional | Se puede incluir motivo de cancelación (máx 500 caracteres) |
| Tipo de cancelación | `cancelledBy` validado contra valores: `client`, `stylist`, `admin`, `system`. Se almacena en el campo `cancelledBy` |

### 4.5 Modificación de Citas

| Regla | Descripción |
|-------|-------------|
| Ventana de tiempo | Solo se puede modificar si faltan al menos 24 horas para la cita (`canBeModified()`) |
| Reprogramar | Se puede cambiar fecha/hora y opcionalmente duración. Nueva fecha no puede ser en el pasado |
| Servicios | Se pueden agregar o remover servicios individuales. No se pueden duplicar |
| Estilista | Se puede reasignar a otro estilista |

---

## 5. Transiciones de Estado

```
PENDING (Pendiente)
    ├── → CONFIRMED (Confirmada)
    └── → CANCELLED (Cancelada)

CONFIRMED (Confirmada)
    ├── → IN_PROGRESS (En Progreso)
    ├── → CANCELLED (Cancelada)
    └── → NO_SHOW (No Se Presentó)

IN_PROGRESS (En Progreso)
    ├── → COMPLETED (Completada)
    └── → CANCELLED (Cancelada)

COMPLETED (Completada)
    └── [Estado terminal - sin transiciones]

CANCELLED (Cancelada)
    └── [Estado terminal - sin transiciones]

NO_SHOW (No Se Presentó)
    └── [Estado terminal - sin transiciones]
```

> Las transiciones se validan en código mediante `AppointmentStatus.canTransitionTo()`

---

## 6. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/appointments/available-slots | Slots disponibles | Público |
| POST | /api/v1/appointments | Crear cita | Autenticado |
| GET | /api/v1/appointments/client/:clientId | Por cliente | Autenticado |
| GET | /api/v1/appointments/stylist/:stylistId | Por estilista | Autenticado |
| GET | /api/v1/appointments/:id | Obtener por ID | Autenticado |
| PUT | /api/v1/appointments/:id | Actualizar cita | Autenticado |
| POST | /api/v1/appointments/:id/confirm | Confirmar | Autenticado |
| POST | /api/v1/appointments/:id/cancel | Cancelar | Autenticado |

---

## 7. Parámetros de Slots Disponibles

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| date | string | Sí | Fecha en formato YYYY-MM-DD |
| duration | number | No | Duración en minutos (default: 30, min: 15, max: 480) |
| stylistId | UUID | No | Filtrar por estilista |
| serviceIds | UUID[] | No | Servicios a incluir |

> Documentación completa de generación de slots en `05-schedules.md`

---

## 8. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Fecha en el pasado, sin servicios, formato inválido |
| 401 | No autenticado | Token faltante |
| 403 | Sin permisos | Sin autorización para la acción |
| 404 | No encontrado | Cita, cliente, estilista o schedule no existe |
| 409 | Conflicto | Horario ya ocupado |
| 422 | Regla de negocio | Cancelar muy tarde, transición de estado inválida |

---

## 9. Relaciones con Otros Módulos

- **Auth**: El `userId` identifica quién creó la cita. El `clientId` del DTO es siempre el `User.id`
- **Clients**: Cada cita está asociada a un cliente (`clientId`). El use case resuelve el Client vía `findByUserId()`
- **Stylists**: Las citas pueden asignarse a estilistas (`stylistId`). Se valida que el estilista ofrezca los servicios seleccionados (`isOffering = true`)
- **Services**: Las citas incluyen uno o más servicios (`serviceIds`). Se valida que estén activos (`isActive = true`)
- **Schedules**: Determina disponibilidad de horarios y vincula la cita a un horario (`scheduleId`). Se valida que la cita caiga dentro del horario laboral
- **Holidays**: Los feriados afectan la disponibilidad de citas. El sistema consulta `ScheduleAvailabilityService` que implementa la prioridad `ScheduleException > Holiday (día cerrado) > Schedule regular`. Al crear un feriado, se cancelan automáticamente las citas activas en esa fecha
- **Payments**: Las citas pueden tener pagos asociados. Solo se permiten pagos para citas en estado CONFIRMED o COMPLETED
- **Notifications**: Se envían notificaciones sobre citas

---

## 10. ScheduleAvailabilityService (Servicio de Dominio)

Servicio de dominio que determina el horario efectivo para una fecha específica. Implementa la lógica de prioridad:

1. **ScheduleException** (máxima prioridad): si existe una excepción para la fecha, usa su horario especial
2. **Holiday** (sin excepción): el día está cerrado (retorna `null`)
3. **Schedule regular** (fallback): usa el horario configurado para el día de la semana

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `getEffectiveSchedule(date)` | `EffectiveSchedule \| null` | Horario efectivo del día con `startTime`, `endTime` y `source` ('exception' \| 'regular'). `null` si cerrado |
| `isDayClosed(date)` | `boolean` | `true` si el día está cerrado (feriado sin excepción o sin horario regular) |

Integrado en: `CreateAppointment` (pasos 4-6), `GetAvailableSlots` (pasos 5-6), `CreateHoliday` (auto-cancel).

---

## 11. Limitaciones Conocidas

_No hay limitaciones conocidas pendientes. Los issues ISSUE-12, ISSUE-16 e ISSUE-20 fueron resueltos en el plan de intervención v3._
