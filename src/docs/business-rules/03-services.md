# Servicios - Reglas de Negocio

> Última actualización: 2026-06-15 | Versión: 2.2

---

## 1. Descripción General

Los servicios representan los tratamientos y procedimientos ofrecidos por el salón (ej: "Corte de cabello", "Tinte completo", "Manicure"). Son definidos centralmente por el administrador y los estilistas eligen cuáles ofrecer.

---

## 2. Entidades

### Service

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre del servicio (requerido, máx 150 caracteres) |
| description | string | Descripción detallada (requerido, máx 1000 caracteres) |
| duration | number | Duración en minutos (1-480) |
| durationVariation | number | Variación permitida en minutos (≥ 0, no excede duration) |
| price | number | Precio en centavos (≥ 0) |
| isActive | boolean | Estado activo/inactivo (default: true) |
| categoryId | UUID | Categoría a la que pertenece |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

---

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Listar servicios | ✅ | ✅ | ✅ | ✅ |
| Ver servicio | ✅ | ✅ | ✅ | ✅ |
| Crear servicio | ✅ | ❌ | ❌ | ❌ |
| Actualizar servicio | ✅ | ❌ | ❌ | ❌ |
| Activar/Desactivar | ✅ | ❌ | ❌ | ❌ |
| Eliminar servicio | ✅ | ❌ | ❌ | ❌ |

> **Nota**: Los servicios son definidos centralmente por el ADMIN. Los estilistas solo eligen cuáles ofrecen mediante el módulo Stylist-Service.

---

## 4. Reglas de Negocio

### 4.1 Creación

| Regla | Descripción |
|-------|-------------|
| Nombre requerido | No puede estar vacío, máximo 150 caracteres, se trimea al guardar |
| Nombre único | No pueden existir dos servicios con el mismo nombre |
| Descripción requerida | Obligatoria, máximo 1000 caracteres, se trimea al guardar |
| Duración válida | Debe ser mayor a 0 minutos, máximo 480 minutos (8 horas) |
| Variación de duración | No puede ser negativa, no puede exceder la duración base |
| Precio válido | No puede ser negativo (≥ 0). Se almacena en centavos (el sanitizer convierte automáticamente) |
| Categoría válida | El `categoryId` debe existir |
| Estado inicial | Se crea con `isActive = true` por defecto |

### 4.2 Duración

| Regla | Valor |
|-------|-------|
| Duración mínima | 1 minuto |
| Duración máxima | 480 minutos (8 horas). Alineado con el máximo de duración de citas en el módulo Appointments |
| Variación | Permite ajustar ± minutos según estilista. No puede ser negativa ni exceder la duración base |

### 4.3 Actualización

| Regla | Descripción |
|-------|-------------|
| Parcial | Se pueden actualizar campos individuales |
| Campo requerido | Al menos un campo debe proporcionarse para actualizar |
| Nombre único | Si se cambia el nombre, debe seguir siendo único |
| Categoría | Se puede reasignar a otra categoría existente |
| Mismas validaciones | Nombre, descripción, duración, variación y precio deben cumplir las mismas reglas que en creación |

### 4.4 Eliminación

| Regla | Descripción |
|-------|-------------|
| Sin citas activas | No se puede eliminar un servicio que tenga citas en estado no terminal (PENDING, CONFIRMED). El use case `DeleteService` valida esto consultando `IAppointmentRepository.existsActiveByServiceId()` y lanza `BusinessRuleError` si existen |
| Alternativa | Se recomienda desactivar en lugar de eliminar |

### 4.5 Asignación a Estilistas (Stylist-Service)

| Regla | Descripción |
|-------|-------------|
| Servicio activo requerido | Solo se pueden asignar servicios con `isActive = true`. `AssignServiceToStylist` valida el estado del servicio y lanza `BusinessRuleError` si está inactivo |
| Estilista válido | El estilista debe existir en el sistema |
| Asignación única | No se puede asignar el mismo servicio al mismo estilista más de una vez |

---

## 5. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/services | Listar todos los servicios | Público |
| GET | /api/v1/services/active | Listar servicios activos | Público |
| GET | /api/v1/services/:id | Obtener por ID | Público |
| GET | /api/v1/services/category/:categoryId | Por categoría | Público |
| GET | /api/v1/services/category/:categoryId/active | Activos por categoría | Público |
| POST | /api/v1/services | Crear servicio | Admin |
| PUT | /api/v1/services/:id | Actualizar | Admin |
| PATCH | /api/v1/services/:id/activate | Activar servicio | Admin |
| PATCH | /api/v1/services/:id/deactivate | Desactivar servicio | Admin |
| DELETE | /api/v1/services/:id | Eliminar | Admin |

---

## 6. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Duración negativa, precio inválido |
| 401 | No autenticado | Token faltante |
| 403 | Sin permisos | Cliente intentando crear |
| 404 | No encontrado | Servicio o categoría no existe |
| 409 | Conflicto | Nombre de servicio duplicado |

---

## 7. Relaciones con Otros Módulos

- **Categories**: Cada servicio pertenece a una categoría. La eliminación de una categoría requiere que no tenga servicios asociados
- **Stylist-Service**: Los estilistas asignan servicios que ofrecen. Solo se pueden asignar servicios activos
- **Appointments**: Las citas incluyen uno o más servicios. La eliminación de un servicio requiere que no tenga citas activas. `CreateAppointment` valida que los servicios estén activos y que el estilista los ofrezca
- **Payments**: Los precios de servicios se almacenan en **centavos** (conversión automática vía sanitizer). Los montos de pagos en el módulo Payments se expresan en la **unidad monetaria base** (ej: pesos, dólares). La conversión es responsabilidad del consumidor de la API
