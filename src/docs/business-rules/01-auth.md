# Autenticación y Usuarios - Reglas de Negocio

> Última actualización: 2026-06-27 | Versión: 3.0

---

## 1. Descripción General

El módulo de autenticación gestiona el registro, login y sesiones de usuarios mediante JWT (JSON Web Tokens). Define tres roles principales con diferentes niveles de acceso al sistema.

---

## 2. Entidades

### User

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | string | Nombre completo |
| email | string | Email único (usado para login) |
| phone | string | Teléfono de contacto |
| password | string | Hash de contraseña (bcrypt) |
| isActive | boolean | Estado del usuario |
| profilePicture | string? | URL de foto de perfil |
| roleId | UUID | Rol asignado |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### Role

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | RoleName | ADMIN, STYLIST, CLIENT |
| description | string? | Descripción del rol (opcional) |
| createdAt | DateTime | Fecha de creación |

### Client (extensión de User)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| userId | UUID | Referencia al User |
| preferences | string? | Preferencias del cliente (texto serializado) |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

> **Nota:** La entidad Stylist pertenece al módulo `services`. Ver `04-stylists.md`.

---

## 3. Permisos por Rol

| Acción | ADMIN | STYLIST | CLIENT | Público |
|--------|-------|---------|--------|---------|
| Register | ✅ | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ | ✅ |
| Get Profile | ✅ | ✅ | ✅ | ❌ |
| Update Profile | ✅ | ✅ | ✅ | ❌ |
| Change Password | ✅ | ✅ | ✅ | ❌ |
| Deactivate User | ✅ | ❌ | ❌ | ❌ |
| Refresh Token | ✅ | ✅ | ✅ | ✅ |

---

## 4. Reglas de Negocio

### 4.1 Registro de Usuarios

| Regla | Descripción |
|-------|-------------|
| Nombre requerido | No puede estar vacío, máximo 100 caracteres, se trimea al guardar |
| Email único | No pueden existir dos usuarios con el mismo email |
| Email válido | Debe tener formato de email válido. Se normaliza a minúsculas al registrar |
| Teléfono válido | 7-15 dígitos, sin letras ni caracteres especiales, `+` opcional al inicio |
| Password seguro | Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número |
| Rol por defecto | Si no se especifica, se asigna rol CLIENT |
| Foto de perfil | Opcional. Si se proporciona, debe ser una URL válida |

### 4.2 Login

| Regla | Descripción |
|-------|-------------|
| Credenciales válidas | Email y password deben coincidir |
| Usuario activo | Solo usuarios con `isActive = true` pueden loguearse |
| Tokens generados | Se genera accessToken (15min) y refreshToken (7 días) |

### 4.3 Tokens JWT

| Token | Duración | Uso |
|-------|----------|-----|
| accessToken | 15 minutos | Autenticación en cada request |
| refreshToken | 7 días | Obtener nuevo accessToken |

### 4.4 Actualización de Perfil

| Regla | Descripción |
|-------|-------------|
| Propiedad | Solo el propio usuario puede actualizar su perfil |
| Email inmutable | El email no puede cambiarse después del registro |
| Password separado | La contraseña se cambia en endpoint separado |
| Nombre válido | Si se envía, no puede estar vacío (máx 100 caracteres) |
| Teléfono válido | Si se envía, debe cumplir el mismo formato que en registro |
| Foto de perfil | Si se envía, debe ser una URL válida |

### 4.5 Cambio de Contraseña

| Regla | Descripción |
|-------|-------------|
| Contraseña actual | Debe proporcionarse y ser correcta para autorizar el cambio |
| Nueva contraseña | Debe cumplir los mismos requisitos de seguridad que en registro (8+ chars, mayúscula, minúscula, número) |

### 4.6 Desactivación de Usuarios

| Regla | Descripción |
|-------|-------------|
| Solo ADMIN | Solo usuarios con rol ADMIN pueden desactivar otros usuarios |
| Usuario activo | No se puede desactivar un usuario que ya está inactivo (`BusinessRuleError`) |
| UUID válido | El `userId` debe ser un UUID válido |
| Cascada STYLIST | Si el usuario tiene rol STYLIST, se ejecutan acciones en cascada: (1) Cancelar todas las citas activas (PENDING/CONFIRMED) con `cancellationReason: 'Stylist deactivated'` y `cancelledBy: 'system'`, (2) Desactivar todas las asignaciones StylistService activas (`isOffering = false`) |
| Sin cascada otros roles | Para CLIENT y ADMIN no se ejecuta cascada |
| Graceful degradation | Si el usuario tiene rol STYLIST pero no tiene registro en la tabla Stylist, la cascada retorna conteos en 0 sin lanzar error |
| Response | Retorna `DeactivateUserResponseDto` con `userId`, `email`, `name`, `cascadeApplied` (boolean) y `cascadeSummary` (conteo de citas canceladas y servicios desactivados) |

---

## 5. Endpoints REST

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | /api/v1/auth/register | Registrar usuario | Público |
| POST | /api/v1/auth/login | Iniciar sesión | Público |
| POST | /api/v1/auth/refresh-token | Refrescar token | Público |
| GET | /api/v1/auth/profile | Obtener perfil | Autenticado |
| PUT | /api/v1/auth/profile | Actualizar perfil | Autenticado |
| PUT | /api/v1/auth/change-password | Cambiar contraseña | Autenticado |
| PATCH | /api/v1/auth/users/:id/deactivate | Desactivar usuario | Admin |

---

## 6. Códigos de Error

| Código | Significado | Ejemplo |
|--------|-------------|---------|
| 400 | Validación | Email inválido, teléfono inválido, password muy corto |
| 401 | No autenticado | Token inválido o expirado, contraseña actual incorrecta |
| 404 | No encontrado | Usuario o rol no existe |
| 409 | Conflicto | Email ya registrado |

---

## 7. Middleware de Autenticación

El `AuthMiddleware` protege las rutas que requieren autenticación. Expone dos métodos:

| Método | Descripción |
|--------|-------------|
| `authenticate` | Extrae y valida el JWT del header `Authorization: Bearer <token>`. Popula `req.user` con `userId`, `roleId` y `email` |
| `authorize(roles[])` | Verifica que el rol del usuario autenticado esté dentro de los roles permitidos. Consulta la BD dinámicamente |

---

## 8. Relaciones con Otros Módulos

- **Appointments**: El `userId` se usa para identificar quién crea las citas. Al desactivar un estilista, sus citas activas se cancelan automáticamente
- **Notifications**: Las notificaciones se envían a usuarios específicos
- **Payments**: Los pagos están asociados a citas de usuarios
- **Stylists**: Los usuarios con rol STYLIST tienen un perfil Stylist asociado. Al desactivar un estilista, sus asignaciones StylistService se desactivan (`isOffering = false`)

---

## 9. Limitaciones Conocidas

_No hay limitaciones conocidas pendientes. El issue ISSUE-17 fue resuelto en el plan de intervención v3._
