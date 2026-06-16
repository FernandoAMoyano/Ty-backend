# Categorías - Reglas de Negocio

> Última actualización: 2026-06-16 | Versión: 2.2

---

## 1. Descripción General

Las categorías agrupan los servicios ofrecidos por el salón (ej: "Cortes", "Coloración", "Tratamientos"). Permiten organizar y filtrar servicios para una mejor navegación.

---

## 2. Entidades

### Category

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre de la categoría (requerido) |
| description | string? | Descripción opcional |
| isActive | boolean | Estado activo/inactivo (default: true) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

---

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Listar categorías | ✅ | ✅ | ✅ | ✅ |
| Ver categoría | ✅ | ✅ | ✅ | ✅ |
| Crear categoría | ✅ | ❌ | ❌ | ❌ |
| Actualizar categoría | ✅ | ❌ | ❌ | ❌ |
| Activar/Desactivar | ✅ | ❌ | ❌ | ❌ |
| Eliminar categoría | ✅ | ❌ | ❌ | ❌ |

---

## 4. Reglas de Negocio

### 4.1 Creación

| Regla | Descripción |
|-------|-------------|
| Nombre requerido | No puede estar vacío, máximo 100 caracteres, se trimea al guardar |
| Formato de nombre | Solo letras y espacios (incluye acentos: áéíóúñ) |
| Nombre único | No pueden existir dos categorías con el mismo nombre |
| Estado inicial | Se crea con `isActive = true` por defecto |
| Descripción | Opcional, máximo 500 caracteres, se trimea al guardar |

### 4.2 Actualización

| Regla | Descripción |
|-------|-------------|
| Nombre único | Si se cambia el nombre, debe seguir siendo único |
| Parcial | Se pueden actualizar campos individuales |
| Mismas validaciones | Nombre y descripción deben cumplir las mismas reglas de formato y longitud que en creación |

### 4.3 Eliminación

| Regla | Descripción |
|-------|-------------|
| Sin servicios | No se puede eliminar una categoría con servicios asociados |
| Alternativa | Se recomienda desactivar en lugar de eliminar |

### 4.4 Desactivación

| Regla | Descripción |
|-------|-------------|
| Servicios asociados | Al desactivar una categoría, sus servicios siguen activos |
| Filtrado | Las categorías inactivas no aparecen en listados públicos |

> **Decisión de diseño (ISSUE-18):** Los servicios de una categoría inactiva permanecen accesibles individualmente (por ID, búsqueda, listado general). Solo la navegación por categoría se ve afectada. La desactivación de una categoría no tiene efecto cascada sobre el estado `isActive` de sus servicios.

---

## 5. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | /api/v1/categories | Listar todas las categorías | Público |
| GET | /api/v1/categories/active | Listar categorías activas | Público |
| GET | /api/v1/categories/:id | Obtener por ID | Público |
| POST | /api/v1/categories | Crear categoría | Admin |
| PUT | /api/v1/categories/:id | Actualizar | Admin |
| PATCH | /api/v1/categories/:id/activate | Activar categoría | Admin |
| PATCH | /api/v1/categories/:id/deactivate | Desactivar categoría | Admin |
| DELETE | /api/v1/categories/:id | Eliminar | Admin |

---

## 6. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Nombre vacío |
| 401 | No autenticado | Token faltante |
| 403 | Sin permisos | Cliente intentando crear |
| 404 | No encontrado | ID no existe |
| 409 | Conflicto | Nombre duplicado |

---

## 7. Relaciones con Otros Módulos

- **Services**: Cada servicio pertenece a una categoría (`categoryId`)
