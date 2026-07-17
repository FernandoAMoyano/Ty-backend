# Citas (Appointments) - Reglas de Negocio

> Última actualización: 2026-06-29 | Versión: 4.0

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
| userId | UUID | ID del usuario (User.id) que creó la cita (auditoría) |
| clientId | UUID | ID del usuario (User.id) que es el cliente de la cita |
| scheduleId | UUID | Horario del día asociado |
| statusId | UUID | Referencia al estado actual (AppointmentStatus) |
| stylistId | UUID? | ID del usuario (User.id) que es el estilista asignado (opcional) |
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

Todas las rutas de consulta y mutación (ver §3.3) requieren `authenticate` + `authorize(['ADMIN','STYLIST','CLIENT'])`. `authorize` no restringe el acceso en sí mismo (los 3 roles pasan la validación), pero resuelve y adjunta `req.user.roleName`, del que dependen todos los use cases para el control de ownership (`GetAppointmentById`, `GetAppointmentsByClient/Stylist`, `Confirm/Cancel/Update`). Sin `authorize`, `roleName` llegaría `undefined` a los use cases y el filtro de ownership fallaría o se degradaría.

| Acción | ADMIN | STYLIST | CLIENT |
|--------|-------|---------|--------|
| Ver cita por ID | ✅ | ✅ | ✅ |
| Ver citas por cliente (`GET /client/:clientId`) | ✅ (cualquier cliente) | ✅ (cualquier `clientId`; el resultado y el `total` se restringen a las citas donde también participa como estilista o creador — F17) | ✅ solo si `clientId` es el propio (`403 ForbiddenError` en caso contrario) |
| Ver citas por estilista (`GET /stylist/:stylistId`) | ✅ (cualquier estilista) | ✅ solo si `stylistId` es el propio (`403 ForbiddenError` en caso contrario) | ✅ (cualquier `stylistId`; el resultado y el `total` se restringen a las citas donde también participa como cliente o creador — F17) |

> Ver §7.1 para el detalle de paginación (`page`/`limit`) y el shape de respuesta de estos dos listados.

### 3.3 Acciones de mutación (ownership-based)

| Acción | ¿Quién puede? | Validación en código |
|--------|--------------|---------------------|
| Crear cita | Cualquier autenticado (ADMIN, STYLIST o CLIENT) | `authenticate` + `authorize(['ADMIN','STYLIST','CLIENT'])` |
| Confirmar cita | El creador (`userId`) o el estilista asignado (`stylistId`) | `authenticate` + `authorize(['ADMIN','STYLIST','CLIENT'])`; `ConfirmAppointment` valida participación usando `roleName`/`requesterId` resueltos por `authorize` |
| Cancelar cita | El creador (`userId`), cliente (`clientId`), o estilista (`stylistId`) | `authenticate` + `authorize(['ADMIN','STYLIST','CLIENT'])`; `CancelAppointment` valida participación usando `roleName`/`requesterId` resueltos por `authorize` |
| Actualizar cita | Cualquier autenticado (ADMIN, STYLIST o CLIENT) | `authenticate` + `authorize(['ADMIN','STYLIST','CLIENT'])` |

> **Nota sobre ownership:** Los campos `userId`, `clientId` y `stylistId` en Appointment almacenan `User.id`. Esto permite que las comparaciones de ownership (`appointment.clientId === requesterId`) funcionen correctamente, ya que `requesterId` del JWT también es `User.id`.

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
| Cliente válido | El `clientId` del DTO es el `User.id` del cliente. Se almacena directamente en `Appointment.clientId` sin resolución intermedia |
| Estilista válido | Si se especifica, el `stylistId` (User.id) se valida via `IUserRepository.findByIdWithRole()`, verificando rol STYLIST. El mismo `stylistId` (User.id) se usa directamente para consultar `StylistService`, que también almacena `User.id` |
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

> **Nota (F17):** `GET /client/:clientId` y `GET /stylist/:stylistId` devuelven un objeto paginado (no un array plano): `{appointments, total, page, limit, totalPages, hasNextPage, hasPreviousPage}`. Ver §7.1.

---

## 7. Parámetros de Consulta

### 7.1 Paginación de Listados (`GET /client/:clientId`, `GET /stylist/:stylistId`)

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| page | number | No | Número de página (default: 1) |
| limit | number | No | Elementos por página (default: 20, máx: 100) |

**Shape de la respuesta (`data`):**

```
{
  appointments: Appointment[],
  total: number,
  page: number,
  limit: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean
}
```

> Para STYLIST en `/client/:clientId` y para CLIENT en `/stylist/:stylistId`, `appointments`/`total`/`totalPages` reflejan únicamente las citas donde el requester es participante (estilista asignado o creador, y cliente o creador respectivamente). El filtro se aplica en el repositorio (`WHERE`), no en memoria, por lo que la metadata de paginación es consistente con el filtro real. Ver §3.2.

### 7.2 Parámetros de Slots Disponibles

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

- **Auth**: El `userId` identifica quién creó la cita. Los campos `clientId` y `stylistId` también almacenan `User.id`, lo que permite comparaciones directas de ownership contra el `requesterId` del JWT
- **Clients**: Cada cita está asociada a un cliente via `clientId` (User.id). No existe una tabla `Client` separada; `Appointment` referencia directamente a `User`
- **Stylists**: Las citas pueden asignarse a estilistas via `stylistId` (User.id). No existe una tabla `Stylist` separada: el use case valida el rol via `IUserRepository.findByIdWithRole()` y usa el mismo `User.id` directamente para consultar `StylistService`
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

_No hay limitaciones conocidas pendientes. La antigua asimetría de IDs (D9) entre `Appointment.stylistId` y `StylistService.stylistId` fue resuelta: ambos campos almacenan `User.id` directamente, sin necesidad de resolución intermedia._
