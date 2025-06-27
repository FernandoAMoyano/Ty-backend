# Turnity API Documentation

Documentación completa de la API REST de Turnity Backend.


# Índice
---

1. [Base URL](#base-url)  
2. [Autenticación](#autenticación)  
   [2.1 Headers requeridos](#headers-requeridos)  
3. [Auth Endpoints](#auth-endpoints)  
    [3.1 Registrar Usuario](#1-registrar-usuario)  
    [3.2 Iniciar Sesión](#2-iniciar-sesión)  
    [3.3 Renovar Token](#3-renovar-token)  
    [3.4 Obtener Perfil](#4-obtener-perfil)  
    [3.5 Actualizar Perfil](#5-actualizar-perfil)  
    [3.6 Cambiar Contraseña](#6-cambiar-contraseña)  
4. [Códigos de Estado HTTP](#códigos-de-estado-http)  
5. [Roles de Usuario](#roles-de-usuario)  
6. [Validaciones](#validaciones)  
7. [Headers de Response](#headers-de-response)  
8. [Rate Limiting](#rate-limiting)  
9. [Testing con cURL](#testing-con-curl)  
10. [Usuarios de Prueba (Seed Data)](#usuarios-de-prueba-seed-data)  
11. [Ejemplos de Flujo Completo](#ejemplos-de-flujo-completo)  
12. [Próximas Funcionalidades](#próximas-funcionalidades)


# 🟣Base URL

- [Índice](#índice)


```
http://localhost:3000/api/v1
```



# 🟣Autenticación

- [Índice](#índice)

La API utiliza **JWT (JSON Web Tokens)** para autenticación.

### Headers requeridos:
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```



# 🟣Auth Endpoints

- [Índice](#índice)


### 1. Registrar Usuario
Crea una nueva cuenta de usuario.

```http
POST /auth/register
```

#### **Registro básico (rol CLIENT por defecto):**
```json
{
  "name": "Ana López",
  "email": "ana.lopez@example.com",
  "phone": "+5491123456789",
  "password": "MiPassword123!"
}
```

#### **Registro con rol específico:**
```json
{
  "name": "Elena Martínez",
  "email": "elena.martinez@example.com",
  "phone": "+5491198765432",
  "password": "StylistPass123!",
  "roleName": "STYLIST"
}
```

**Campos del Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ | Nombre completo del usuario |
| `email` | string | ✅ | Email único (será normalizado a minúsculas) |
| `phone` | string | ✅ | Teléfono en formato internacional |
| `password` | string | ✅ | Contraseña segura (ver validaciones) |
| `roleName` | string | ❌ | Rol del usuario. Default: `"CLIENT"` |
| `profilePicture` | string | ❌ | URL de la foto de perfil |

**Roles válidos:**
- `"CLIENT"` - Cliente que puede agendar citas (default)
- `"STYLIST"` - Estilista que ofrece servicios
- `"ADMIN"` - Administrador del sistema

**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-usuario",
    "name": "Ana López",
    "email": "ana.lopez@example.com",
    "phone": "+5491123456789",
    "isActive": true,
    "role": {
      "id": "role-uuid",
      "name": "CLIENT",
      "description": "Cliente que puede agendar citas"
    },
    "createdAt": "2025-06-16T10:30:00.000Z",
    "updatedAt": "2025-06-16T10:30:00.000Z"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
```json
// 409 - Email ya existe
{
  "success": false,
  "message": "Email already exists",
  "code": "CONFLICT"
}

// 400 - Rol inválido
{
  "success": false,
  "message": "Invalid role: INVALID_ROLE. Valid roles are: CLIENT, STYLIST, ADMIN",
  "code": "VALIDATION_ERROR"
}

// 400 - Contraseña débil
{
  "success": false,
  "message": "Password must be at least 8 characters long and contain uppercase, lowercase, and number",
  "code": "VALIDATION_ERROR"
}
```


---
### 2. Iniciar Sesión

- [Índice](#índice)

Autentica un usuario y devuelve tokens de acceso.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "ana.lopez@example.com",
  "password": "MiPassword123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-del-usuario",
      "name": "Ana López",
      "email": "ana.lopez@example.com",
      "role": {
        "id": "role-uuid",
        "name": "CLIENT"
      }
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
```json
// 401 - Credenciales inválidas
{
  "success": false,
  "message": "Invalid credentials",
  "code": "UNAUTHORIZED"
}
```

---

### 3. Renovar Token

- [Índice](#índice)

Renueva el token de acceso usando el refresh token.

```http
POST /auth/refresh-token
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "token": "nuevo-jwt-token",
    "refreshToken": "nuevo-refresh-token",
    "user": {
      "id": "uuid-del-usuario",
      "name": "Ana López",
      "email": "ana.lopez@example.com"
    }
  },
  "message": "Token refreshed successfully"
}
```

---

### 4. Obtener Perfil

- [Índice](#índice)

Obtiene información del usuario autenticado.

```http
GET /auth/profile
```

**Headers:**
```http
Authorization: Bearer <your-jwt-token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-usuario",
    "name": "Ana López",
    "email": "ana.lopez@example.com",
    "phone": "+5491123456789",
    "isActive": true,
    "profilePicture": "https://example.com/photo.jpg",
    "role": {
      "id": "role-uuid",
      "name": "CLIENT",
      "description": "Cliente que puede agendar citas"
    },
    "createdAt": "2025-06-16T10:30:00.000Z",
    "updatedAt": "2025-06-16T10:30:00.000Z"
  },
  "message": "Profile retrieved successfully"
}
```

---

### 5. Actualizar Perfil

- [Índice](#índice)

Actualiza información del usuario autenticado.

```http
PUT /auth/profile
```

**Headers:**
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Ana María López",
  "phone": "+5491987654321",
  "profilePicture": "https://example.com/new-photo.jpg"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-del-usuario",
    "name": "Ana María López",
    "email": "ana.lopez@example.com",
    "phone": "+5491987654321",
    "profilePicture": "https://example.com/new-photo.jpg",
    "isActive": true,
    "role": {
      "id": "role-uuid",
      "name": "CLIENT"
    },
    "updatedAt": "2025-06-16T11:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### 6. Cambiar Contraseña

- [Índice](#índice)

Cambia la contraseña del usuario autenticado.

```http
PUT /auth/change-password
```

**Headers:**
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "MiPassword123!",
  "newPassword": "NuevoPassword456!"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
```json
// 401 - Contraseña actual incorrecta
{
  "success": false,
  "message": "Current password is incorrect",
  "code": "UNAUTHORIZED"
}

// 400 - Nueva contraseña inválida
{
  "success": false,
  "message": "New password must be at least 8 characters long and contain uppercase, lowercase, and number",
  "code": "VALIDATION_ERROR"
}
```



# 🟣Códigos de Estado HTTP


- [Índice](#índice)

| Código | Significado | Uso |
|--------|-------------|-----|
| `200` | OK | Operación exitosa |
| `201` | Created | Recurso creado exitosamente |
| `400` | Bad Request | Datos de entrada inválidos |
| `401` | Unauthorized | Token inválido o faltante |
| `403` | Forbidden | Sin permisos suficientes |
| `404` | Not Found | Recurso no encontrado |
| `409` | Conflict | Conflicto (ej: email duplicado) |
| `500` | Internal Server Error | Error interno del servidor |

## Roles de Usuario

- [Índice](#índice)

| Rol | Descripción | Permisos | Uso |
|-----|-------------|----------|-----|
| `CLIENT` | Cliente del sistema | Agendar citas, ver perfil | Default para registro |
| `STYLIST` | Estilista/Peluquero | Gestión de citas y servicios | Profesionales |
| `ADMIN` | Administrador | Acceso completo al sistema | Administración |



# 🟣Validaciones

- [Índice](#índice)


### **Contraseña:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula  
- Al menos 1 número
- Al menos 1 carácter especial

### **Email:**
- Formato válido (usuario@dominio.com)
- Único en el sistema
- Se normaliza automáticamente a minúsculas

### **Teléfono:**
- Formato internacional (+1234567890)
- Caracteres permitidos: +, números, espacios, guiones

### **Rol:**
- Case insensitive ("client", "CLIENT", "Client" son válidos)
- Se normaliza automáticamente a mayúsculas



# 🟣Headers de Response


- [Índice](#índice)

Todas las respuestas incluyen estos headers:

```http
Content-Type: application/json
X-Powered-By: Express
```

# 🟣Rate Limiting


- [Índice](#índice)
<br>
- **Límite general:** 100 requests por minuto por IP
- **Login/Register:** 5 intentos por minuto por IP

# 🟣Testing con cURL

### **Registrar cliente (rol por defecto):**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Roberto Silva",
    "email": "roberto.silva@example.com",
    "phone": "+5491134567890",
    "password": "TestPass123!"
  }'
```

### **Registrar estilista:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carla Mendoza",
    "email": "carla.mendoza@example.com",
    "phone": "+5491145678901",
    "password": "StylistPass123!",
    "roleName": "STYLIST"
  }'
```

### **Login:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "roberto.silva@example.com",
    "password": "TestPass123!"
  }'
```

### **Obtener perfil:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

# 🟣Usuarios de Prueba (Seed Data)


- [Índice](#índice)

Para testing rápido, puedes usar estos usuarios que se crean automáticamente:

### **Cliente 1:**
```json
{
  "email": "maria@example.com",
  "password": "client123",
  "role": "CLIENT"
}
```

### **Cliente 2:**
```json
{
  "email": "juan@example.com", 
  "password": "client123",
  "role": "CLIENT"
}
```

### **Administrador:**
```json
{
  "email": "admin@turnity.com",
  "password": "admin123",
  "role": "ADMIN"
}
```

### **Estilista 1:**
```json
{
  "email": "lucia@turnity.com",
  "password": "stylist123",
  "role": "STYLIST"
}
```

### **Estilista 2:**
```json
{
  "email": "carlos@turnity.com",
  "password": "stylist123",
  "role": "STYLIST"
}
```


# 🟣Ejemplos de Flujo Completo


- [Índice](#índice)

### **Flujo 1: Cliente registra y agenda cita**
```bash
# 1. Registrar como cliente
POST /auth/register
{
  "name": "Carlos Ruiz",
  "email": "carlos.ruiz@example.com",
  "phone": "+5491156789012",
  "password": "ClientPass123!"
}

# 2. Login
POST /auth/login
{
  "email": "carlos.ruiz@example.com",
  "password": "ClientPass123!"
}

# 3. Ver perfil
GET /auth/profile
Authorization: Bearer <token>
```

### **Flujo 2: Estilista se registra**
```bash
# 1. Registrar como estilista
POST /auth/register
{
  "name": "Sofia Herrera",
  "email": "sofia.herrera@example.com",
  "phone": "+5491167890123",
  "password": "StylistPass123!",
  "roleName": "STYLIST"
}

# 2. Login y gestionar servicios
POST /auth/login
{
  "email": "sofia.herrera@example.com",
  "password": "StylistPass123!"
}
```




# 🟣Próximas Funcionalidades


- [Índice](#índice)

La API se extenderá con estos endpoints:

- **Services:** Gestión de servicios de belleza
- **Appointments:** Sistema de citas y reservas
- **Schedules:** Horarios de disponibilidad
- **Notifications:** Sistema de notificaciones
- **Payments:** Procesamiento de pagos


