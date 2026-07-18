# Notificaciones - Reglas de Negocio

> Última actualización: 2026-06-15 | Versión: 2.2

---

## 1. Descripción General

El módulo de notificaciones gestiona el envío y seguimiento de mensajes a los usuarios del sistema. Incluye notificaciones de citas, recordatorios, promociones y avisos del sistema.

---

## 2. Entidades

### Notification

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| type | NotificationTypeEnum | Tipo de notificación |
| message | string | Contenido del mensaje (máx 1000 caracteres) |
| userId | UUID | Usuario destinatario |
| statusId | UUID | Referencia al estado actual (NotificationStatus) |
| sentAt | DateTime? | Fecha de envío (null si no fue enviada) |
| createdAt | DateTime | Fecha de creación |

### NotificationTypeEnum

| Tipo | Descripción | Uso |
|------|-------------|-----|
| APPOINTMENT_CONFIRMATION | Confirmación de cita | Cuando una cita es confirmada |
| APPOINTMENT_REMINDER | Recordatorio de cita | Antes de la cita programada |
| APPOINTMENT_CANCELLATION | Cancelación de cita | Cuando una cita es cancelada |
| PROMOTIONAL | Promociones y ofertas | Campañas de marketing |
| SYSTEM | Notificaciones del sistema | Avisos generales, mantenimiento |

### NotificationStatus

Entidad completa con métodos de negocio, no solo un enum.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre del estado (máx 50 caracteres) |
| description | string? | Descripción del estado (máx 200 caracteres) |

**Valores del enum NotificationStatusEnum:**

| Estado | Descripción |
|--------|-------------|
| PENDING | Creada, pendiente de envío |
| SENT | Enviada exitosamente |
| READ | Leída por el usuario |
| FAILED | Error en el envío |

**Métodos de negocio:**
- `isTerminalStatus()` — Retorna `true` si el estado es READ o FAILED
- `canTransitionTo(newStatus)` — Valida si la transición de estado es permitida

---

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Crear notificación | ✅ | ❌ | ❌ | ❌ |
| Ver mis notificaciones | ✅ | ✅ | ✅ | ❌ |
| Ver notificación por ID | ✅* | ✅* | ✅* | ❌ |
| Obtener conteo no leídas | ✅ | ✅ | ✅ | ❌ |
| Marcar como leída | ✅* | ✅* | ✅* | ❌ |
| Marcar múltiples como leídas | ✅* | ✅* | ✅* | ❌ |
| Marcar todas como leídas | ✅ | ✅ | ✅ | ❌ |

> *Solo puede acceder/modificar sus propias notificaciones (validación de propiedad por `userId`)

---

## 4. Reglas de Negocio

### 4.1 Creación

| Regla | Descripción |
|-------|-------------|
| Solo Admin | Solo administradores pueden crear notificaciones |
| userId requerido | Debe ser un UUID válido. `CreateNotification` verifica que el usuario exista en la BD vía `IUserRepository.findById()` y lanza `NotFoundError` si no existe |
| Tipo válido | Debe ser uno de los valores del `NotificationTypeEnum` |
| Mensaje requerido | No puede estar vacío, máximo 1000 caracteres |
| Estado inicial | Se crea con estado PENDING |

### 4.2 Propiedad

| Regla | Descripción |
|-------|-------------|
| Acceso propio | Un usuario solo puede ver sus propias notificaciones (filtrado por `userId`) |
| Modificación propia | Un usuario solo puede marcar como leídas sus propias notificaciones |
| Sin bypass admin | Todos los usuarios están sujetos a la misma validación de propiedad |

### 4.3 Marca de Lectura

| Regla | Descripción |
|-------|-------------|
| Cambio de estado | Al marcar como leída, el `statusId` cambia al estado READ |
| Sin campo readAt | La lectura se trackea exclusivamente por el cambio de `statusId`, no por un campo de fecha |
| Idempotente | Marcar como leída una notificación ya leída retorna sin cambios ni error |
| Individual | Vía `PATCH /notifications/:id/read` — valida propiedad y actualiza |
| Batch | Vía `POST /notifications/mark-read` — acepta `notificationId` (uno) o `notificationIds` (varios). Valida propiedad de cada una |
| Todas | Vía `POST /notifications/mark-all-read` — marca todas las del usuario autenticado |

---

## 5. Transiciones de Estado

```
PENDING (Pendiente)
    ├── → SENT (Enviada)
    └── → FAILED (Fallida)

SENT (Enviada)
    └── → READ (Leída)

READ (Leída)
    └── [Estado terminal - sin transiciones]

FAILED (Fallida)
    └── → PENDING (Reintento permitido)
```

> Las transiciones se validan en código mediante `NotificationStatus.canTransitionTo()`, **excepto** en el marcado de lectura (`MarkNotificationAsRead`, individual/batch), que actualiza el `statusId` directamente a READ sin invocar `canTransitionTo()`. En la práctica, una notificación puede pasar de PENDING a READ directamente (sin transicionar por SENT), ya que actualmente no existe un servicio de envío que ejecute la transición PENDING→SENT. Esta es una excepción intencional al diagrama de arriba: READ es alcanzable tanto desde SENT como directamente desde PENDING.

---

## 6. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/notifications | Obtener mis notificaciones | Autenticado |
| POST | /api/v1/notifications | Crear notificación | Admin |
| GET | /api/v1/notifications/unread-count | Conteo de no leídas | Autenticado |
| POST | /api/v1/notifications/mark-read | Marcar múltiples como leídas | Autenticado |
| POST | /api/v1/notifications/mark-all-read | Marcar todas como leídas | Autenticado |
| GET | /api/v1/notifications/:id | Obtener por ID | Propietario |
| PATCH | /api/v1/notifications/:id/read | Marcar una como leída | Propietario |

---

## 7. Filtros y Paginación

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Elementos por página (default: 20, máx: 100) |
| type | string | Filtrar por tipo de notificación (valor del enum) |
| unreadOnly | boolean | Solo notificaciones no leídas (filtra por statusId ≠ READ) |

> **Nota (ISSUE-26):** El default de `limit` es 20 con máximo 100 (`NotificationValidations.getNotifications`). Otros módulos como Holidays usan 10 por menor volumen esperado.

---

## 8. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Mensaje vacío, tipo inválido, UUID mal formado |
| 401 | No autenticado | Token faltante |
| 403 | Sin permisos | Acceder a notificación de otro usuario |
| 404 | No encontrado | Notificación o estado no existe |

---

## 9. Relaciones con Otros Módulos

- **Auth**: Las notificaciones se envían a usuarios específicos (`userId`). Se verifica que el usuario exista antes de crear la notificación
- **Appointments**: Notificaciones de confirmación, recordatorio y cancelación
