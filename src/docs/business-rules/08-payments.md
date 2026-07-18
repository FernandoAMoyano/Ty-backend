# Pagos - Reglas de Negocio

> Última actualización: 2026-06-27 | Versión: 3.0

---

## 1. Descripción General

El módulo de pagos gestiona el procesamiento de cobros asociados a las citas. Soporta múltiples métodos de pago y permite operaciones de procesamiento, reembolso y cancelación.

---

## 2. Entidades

### Payment

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| appointmentId | UUID | Cita asociada |
| amount | number | Monto del pago (float, mayor a 0) |
| method | PaymentMethodEnum? | Método de pago (null hasta procesarse) |
| status | PaymentStatusEnum | Estado del pago |
| refundReason | string? | Razón del reembolso (máx 500 caracteres) |
| paymentDate | DateTime? | Fecha de procesamiento (null hasta completarse) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### PaymentStatus (Enum)

| Estado | Descripción | Transiciones permitidas |
|--------|-------------|------------------------|
| PENDING | Pago creado, pendiente de procesar | → COMPLETED, → FAILED |
| COMPLETED | Pago procesado exitosamente | → REFUNDED |
| REFUNDED | Pago reembolsado | [Terminal] |
| FAILED | Pago cancelado o fallido | [Terminal] |

### PaymentMethod (Enum)

| Método | Descripción |
|--------|-------------|
| CASH | Efectivo |
| CREDIT_CARD | Tarjeta de crédito |
| DEBIT_CARD | Tarjeta de débito |
| TRANSFER | Transferencia bancaria |
| ONLINE | Pago en línea (pasarela de pago) |

---

## 3. Permisos por Rol

> **Nota de ownership (F18):** para STYLIST y CLIENT, los permisos de esta tabla están además restringidos por ownership sobre la cita asociada al pago. STYLIST solo accede (lectura, creación y mutaciones de proceso/cancelación) a pagos de citas donde es el estilista asignado; CLIENT solo accede en lectura a pagos de citas donde es el cliente o el creador (vía `/appointment/:id`, sin acceso de mutación). ADMIN no tiene restricción de ownership en ningún caso.
>
> **Ownership en creación (PAY-25):** `CreatePayment` valida que, si el solicitante es STYLIST, sea el estilista asignado a la cita del pago (`ForbiddenError` si no); un estilista no puede crear pagos para citas de otros estilistas.

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Crear pago | ✅ | ✅ (solo su cita) | ❌ | ❌ |
| Listar todos los pagos | ✅ | ❌ | ❌ | ❌ |
| Ver pago por ID | ✅ | ✅ (solo su cita) | ❌ | ❌ |
| Ver pagos por cita | ✅ | ✅ (solo su cita) | ✅ (solo su cita, vía `/appointment/:id`) | ❌ |
| Obtener estadísticas | ✅ | ❌ | ❌ | ❌ |
| Procesar pago | ✅ | ✅ (solo su cita) | ❌ | ❌ |
| Reembolsar pago | ✅ | ❌ | ❌ | ❌ |
| Cancelar pago | ✅ | ✅ (solo su cita) | ❌ | ❌ |
| Actualizar monto | ✅ | ❌ | ❌ | ❌ |

---

## 4. Reglas de Negocio

### 4.1 Creación de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Monto requerido | El campo `amount` es obligatorio | 400 |
| Monto positivo | El monto debe ser mayor a 0 | 400 |
| Cita válida | El `appointmentId` debe ser UUID válido. `CreatePayment` verifica que la cita exista vía `IAppointmentRepository.findById()` y lanza `NotFoundError` si no existe | 400/404 |
| Estado de cita permitido | Solo se pueden crear pagos para citas en estado **CONFIRMED** o **COMPLETED**. CONFIRMED = prepago, COMPLETED = pago posterior. Se lanza `BusinessRuleError` para otros estados | 422 |
| UUID válido | Los IDs deben tener formato UUID | 400 |
| Estado inicial | Los pagos se crean con estado PENDING | - |
| Método nulo | El método de pago es null hasta procesarse | - |
| Múltiples pagos | Se permiten múltiples pagos por cita (pagos parciales, split payments). No hay validación de unicidad | - |

### 4.2 Procesamiento de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo pendientes | Solo se pueden procesar pagos en estado PENDING | 422 |
| Método requerido | Se debe especificar el método de pago | 400 |
| Método válido | El método debe ser uno de los valores del enum | 400 |
| Fecha de pago | Se registra automáticamente `paymentDate` (nombre real del campo en la entidad/DTO/schema) | - |
| Estado final | El estado cambia a COMPLETED | - |

### 4.3 Reembolso de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo completados | Solo se pueden reembolsar pagos COMPLETED | 422 |
| Razón | La API acepta `reason` opcional (máx 500 chars). Se almacena en el campo `refundReason` de la entidad Payment |
| Estado final | El estado cambia a REFUNDED |
| Solo Admin | Solo administradores pueden reembolsar | 403 |

### 4.4 Cancelación de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo pendientes | Solo se pueden cancelar pagos PENDING | 422 |
| Estado final | El estado cambia a FAILED | - |
| No reversible | Una vez cancelado, no se puede revertir | - |

### 4.5 Actualización de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo pendientes | Solo se pueden actualizar pagos PENDING | 422 |
| Monto positivo | El nuevo monto debe ser mayor a 0 | 400 |
| Solo Admin | Solo administradores pueden actualizar montos | 403 |

---

## 5. Transiciones de Estado

```
PENDING (Pendiente)
    ├── → COMPLETED (Completado) [via /process]
    └── → FAILED (Cancelado) [via /cancel]

COMPLETED (Completado)
    └── → REFUNDED (Reembolsado) [via /refund]

REFUNDED (Reembolsado)
    └── [Estado terminal - sin transiciones]

FAILED (Cancelado/Fallido)
    └── [Estado terminal - sin transiciones]
```

---

## 6. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | /api/v1/payments | Crear pago | Admin, Stylist |
| GET | /api/v1/payments | Listar pagos (paginado) | Admin |
| GET | /api/v1/payments/statistics | Obtener estadísticas | Admin |
| GET | /api/v1/payments/appointment/:id | Pagos de una cita | Admin, Stylist (dueño), Client (dueño) |
| GET | /api/v1/payments/:id | Obtener pago por ID | Admin, Stylist (dueño) |
| PUT | /api/v1/payments/:id | Actualizar monto | Admin |
| POST | /api/v1/payments/:id/process | Procesar pago | Admin, Stylist |
| POST | /api/v1/payments/:id/refund | Reembolsar pago | Admin |
| POST | /api/v1/payments/:id/cancel | Cancelar pago | Admin, Stylist |

---

## 7. Filtros y Paginación

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| page | number | Página actual (default: 1) |
| limit | number | Elementos por página (default: 20, max: 100) |
| status | string | Filtrar por estado (PENDING, COMPLETED, REFUNDED, FAILED) |
| appointmentId | UUID | Filtrar por cita específica |
| startDate | date | Fecha inicio del rango |
| endDate | date | Fecha fin del rango |

> **Nota (ISSUE-26):** El default de `limit` es 20 con máximo 100. Consistente con Notifications (20). Holidays usa 10 por menor volumen esperado.

---

## 8. Estadísticas de Pagos

| Campo | Descripción |
|-------|-------------|
| totalRevenue | Suma de pagos COMPLETED |
| totalPayments | Número total de pagos |
| completedPayments | Número de pagos completados |
| pendingPayments | Número de pagos pendientes |
| refundedPayments | Número de pagos reembolsados |
| failedPayments | Número de pagos fallidos |
| averagePayment | Promedio de pagos completados |
| paymentsByMethod | Distribución por método de pago |

---

## 9. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación de entrada | UUID inválido, monto negativo |
| 401 | No autenticado | Token faltante o inválido |
| 403 | Sin permisos | Cliente intentando crear pago |
| 404 | No encontrado | Pago no existe |
| 422 | Regla de negocio | Reembolsar pago pendiente |

> **Nota importante**: Los errores 400 son para validaciones de formato/sintaxis, mientras que los errores 422 son para violaciones de reglas de negocio (BusinessRuleError).

---

## 10. Relaciones con Otros Módulos

- **Appointments**: Cada pago está asociado a una cita. Se verifica existencia y estado de la cita al crear el pago. Solo se permiten pagos para citas CONFIRMED (prepago) o COMPLETED (pago posterior)
- **Services**: Los precios de servicios se almacenan en **centavos**. El `amount` del pago se expresa en la **unidad monetaria base** (ej: pesos, dólares), NO en centavos. La conversión es responsabilidad del consumidor de la API

---

## 11. Decisiones de Diseño

| Decisión | Descripción |
|----------|-------------|
| Monto independiente (ISSUE-08, ISSUE-24) | El `amount` del pago es definido por el operador (Admin o Stylist) y no se valida automáticamente contra los precios de los servicios de la cita. Esto permite flexibilidad para descuentos, propinas, pagos parciales y ajustes manuales |
| Unidad monetaria (ISSUE-08) | El `amount` se expresa en la unidad monetaria base (ej: pesos), a diferencia de los precios de servicios que se almacenan en centavos. La conversión es responsabilidad del consumidor de la API |
| Múltiples pagos por cita | Se permiten múltiples pagos para la misma cita sin restricción de unicidad, permitiendo pagos parciales y split payments |
| Estados permitidos | Solo CONFIRMED y COMPLETED permiten pagos: CONFIRMED = prepago antes del servicio, COMPLETED = cobro posterior al servicio |

---

## 12. Limitaciones Conocidas

_No hay limitaciones conocidas pendientes. El issue ISSUE-16 fue resuelto en el plan de intervención v3 (campo `refundReason` agregado a la entidad Payment)._
