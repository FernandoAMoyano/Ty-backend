# Pagos - Reglas de Negocio

> Última actualización: 2026-06-12 | Versión: 2.1

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

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Crear pago | ✅ | ✅ | ❌ | ❌ |
| Listar todos los pagos | ✅ | ❌ | ❌ | ❌ |
| Ver pago por ID | ✅ | ✅ | ✅ | ❌ |
| Ver pagos por cita | ✅ | ✅ | ✅ | ❌ |
| Obtener estadísticas | ✅ | ❌ | ❌ | ❌ |
| Procesar pago | ✅ | ✅ | ❌ | ❌ |
| Reembolsar pago | ✅ | ❌ | ❌ | ❌ |
| Cancelar pago | ✅ | ✅ | ❌ | ❌ |
| Actualizar monto | ✅ | ❌ | ❌ | ❌ |

---

## 4. Reglas de Negocio

### 4.1 Creación de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Monto requerido | El campo `amount` es obligatorio | 400 |
| Monto positivo | El monto debe ser mayor a 0 | 400 |
| Cita válida | El `appointmentId` debe ser UUID válido (formato validado, existencia no verificada) | 400 |
| UUID válido | Los IDs deben tener formato UUID | 400 |
| Estado inicial | Los pagos se crean con estado PENDING | - |
| Método nulo | El método de pago es null hasta procesarse | - |

### 4.2 Procesamiento de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo pendientes | Solo se pueden procesar pagos en estado PENDING | 422 |
| Método requerido | Se debe especificar el método de pago | 400 |
| Método válido | El método debe ser uno de los valores del enum | 400 |
| Fecha de pago | Se registra automáticamente `paidAt` | - |
| Estado final | El estado cambia a COMPLETED | - |

### 4.3 Reembolso de Pagos

| Regla | Descripción | Código HTTP |
|-------|-------------|-------------|
| Solo completados | Solo se pueden reembolsar pagos COMPLETED | 422 |
| Razón | La API acepta `reason` opcional (máx 500 chars) pero no se almacena en la entidad | - |
| Estado final | El estado cambia a REFUNDED | - |
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
| GET | /api/v1/payments/appointment/:id | Pagos de una cita | Autenticado |
| GET | /api/v1/payments/:id | Obtener pago por ID | Autenticado |
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

- **Appointments**: Cada pago está asociado a una cita
