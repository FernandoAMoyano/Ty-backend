# Estilistas y Asignación de Servicios - Reglas de Negocio

> Última actualización: 2026-06-16 | Versión: 2.2

---

## 1. Descripción General

El módulo gestiona la relación entre estilistas y los servicios que ofrecen. Los estilistas son simplemente usuarios (`User`) con rol STYLIST; no existe un registro ni una creación automática de un perfil separado. La funcionalidad principal es la asignación de servicios específicos que cada estilista ofrece, con posibilidad de precios personalizados en centavos.

---

## 2. Entidades

### StylistService (Asignación de servicios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| stylistId | UUID | Referencia al User (User.id de un usuario con rol STYLIST) |
| serviceId | UUID | Referencia al Service |
| customPrice | number? | Precio personalizado en centavos (opcional) |
| isOffering | boolean | Si actualmente ofrece el servicio (default: true) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

> **Nota**: StylistService SÍ tiene campo `id` propio (UUID). `stylistId` y `serviceId` no son clave compuesta.

---

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Ver servicios de estilista | ✅ | ✅ | ✅ | ✅ |
| Ver estilistas de un servicio | ✅ | ✅ | ✅ | ✅ |
| Asignar servicio | ✅ | ✅* | ❌ | ❌ |
| Actualizar asignación | ✅ | ✅* | ❌ | ❌ |
| Remover asignación | ✅ | ✅* | ❌ | ❌ |

> *STYLIST solo puede modificar sus propias asignaciones

---

## 4. Reglas de Negocio

### 4.1 Asignación de Servicios

| Regla | Descripción |
|-------|-------------|
| Usuario STYLIST | El User asociado al estilista debe tener rol STYLIST (validado en use case) |
| Estilista válido | El `stylistId` (User.id) se valida via `IUserRepository.findByIdWithRole()`, verificando que el usuario exista y tenga rol STYLIST |
| Servicio válido | El `serviceId` debe existir en la base de datos |
| Relación única | Un estilista solo puede tener una asignación por servicio (ConflictError si duplica) |
| Estado inicial | Se crea con `isOffering = true` por defecto |

### 4.2 Precio Personalizado

| Regla | Descripción |
|-------|-------------|
| Opcional | Si no se especifica, se usa el precio base del servicio |
| No negativo | Si se especifica, debe ser ≥ 0 |
| En centavos | Se almacena en centavos (el sanitizer convierte automáticamente con `Math.round(value * 100)`) |
| Precio efectivo | `getEffectivePrice()` retorna `customPrice` si existe, sino `basePrice` |

### 4.3 Actualización

| Regla | Descripción |
|-------|-------------|
| Campo requerido | Al menos un campo debe proporcionarse para actualizar |
| customPrice | Se puede modificar o eliminar (volver al precio base) |
| isOffering | Se puede activar (`startOffering`) o desactivar (`stopOffering`) |

### 4.4 Estado de Oferta

| Regla | Descripción |
|-------|-------------|
| Toggle | `isOffering` puede activarse/desactivarse sin eliminar la asignación |
| Filtrado | Solo servicios con `isOffering = true` aparecen en el endpoint `/active` y `/offering` |

### 4.5 Eliminación

| Regla | Descripción |
|-------|-------------|
| Existencia | Solo se pueden remover asignaciones que existan (NotFoundError si no) |
| Eliminación directa | Se elimina el registro completo, no es un soft delete |

---

## 5. Endpoints REST

Todos los endpoints están bajo el prefijo `/api/v1/services`.

### Consultas por estilista

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /services/stylists/:stylistId/services | Servicios del estilista | Público |
| GET | /services/stylists/:stylistId/services/active | Servicios activos del estilista | Público |
| GET | /services/stylists/:stylistId/services/detailed | Estilista con servicios detallados | Público |

### Consultas por servicio

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /services/:serviceId/stylists | Estilistas de un servicio | Público |
| GET | /services/:serviceId/stylists/offering | Estilistas que ofrecen el servicio | Público |
| GET | /services/:serviceId/stylists/detailed | Servicio con estilistas detallados | Público |

### Gestión de asignaciones

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | /services/stylists/:stylistId/services | Asignar servicio a estilista | Admin, Propio |
| PUT | /services/stylists/:stylistId/services/:serviceId | Actualizar asignación | Admin, Propio |
| DELETE | /services/stylists/:stylistId/services/:serviceId | Remover asignación | Admin, Propio |

---

## 6. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Precio negativo, campo faltante |
| 401 | No autenticado | Token faltante |
| 403 | Sin permisos | Modificar asignación de otro estilista |
| 404 | No encontrado | Estilista, servicio o asignación no existe |
| 409 | Conflicto | Servicio ya asignado al estilista |

---

## 7. Relaciones con Otros Módulos

- **Auth**: Un estilista no es una entidad separada, es un `User` con rol STYLIST. No existe un "perfil Stylist"; toda validación de rol se hace via `IUserRepository.findByIdWithRole()`
- **Services**: Los estilistas asignan servicios que ofrecen. Solo se pueden asignar servicios activos (`isActive = true`)
- **Appointments**: Las citas se asignan a estilistas específicos. `CreateAppointment` valida que el estilista ofrezca los servicios seleccionados (`isOffering = true`)
- **Schedules**: Cada estilista puede tener su propio horario

---

## 8. Limitaciones Conocidas

_No hay limitaciones conocidas pendientes. El issue ISSUE-17 fue resuelto: la desactivación de un usuario con rol STYLIST ahora ejecuta la cascada completa (cancelación de citas activas y desactivación de asignaciones StylistService)._
