# Citas (Appointments) - Reglas de Negocio

> Última actualización: 2026-06-12 | Versión: 2.1

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

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Ver slots disponibles | ✅ | ✅ | ✅ | ✅ |
| Crear cita | ✅ | ✅ | ✅ | ❌ |
| Ver cita por ID | ✅ | ✅ | ✅ | ❌ |
| Actualizar cita | ✅ | ✅ | ✅ | ❌ |
| Confirmar cita | ✅ | ✅ | ❌ | ❌ |
| Cancelar cita | ✅ | ✅ | ✅ | ❌ |
| Ver citas por cliente | ✅ | ✅ | ✅ | ❌ |
| Ver citas por estilista | ✅ | ✅ | ❌ | ❌ |

---

## 4. Reglas de Negocio

### 4.1 Creación de Citas

| Regla | Descripción |
|-------|-------------|
| Fecha futura | No se pueden crear citas en el pasado |
| Límite futuro | Máximo 6 meses de anticipación |
| Servicio requerido | Al menos un `serviceId` debe proporcionarse |
| Cliente válido | El `clientId` debe existir en la tabla Client |
| Estilista válido | Si se especifica, el `stylistId` debe existir |
| Día laboral | Debe existir un Schedule configurado para el día de la semana |
| Sin conflictos | No debe haber citas superpuestas en el mismo horario (validado por `findConflictingAppointments`) |
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
| Notas | Opcionales, máximo 500 caracteres |

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
| Tipo de cancelación | `cancelledBy` validado contra valores: `client`, `stylist`, `admin`, `system` |

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

- **Auth**: El `userId` identifica quién creó la cita
- **Clients**: Cada cita está asociada a un cliente (`clientId`)
- **Stylists**: Las citas pueden asignarse a estilistas (`stylistId`)
- **Services**: Las citas incluyen uno o más servicios (`serviceIds`)
- **Schedules**: Determina disponibilidad de horarios y vincula la cita a un horario (`scheduleId`)
- **Holidays**: Los feriados afectan la disponibilidad
- **Payments**: Las citas pueden tener pagos asociados
- **Notifications**: Se envían notificaciones sobre citas
