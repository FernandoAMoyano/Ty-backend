# 📚 Turnity API Documentation

Documentación completa de la API REST de Turnity Backend.

## 🌐 Base URL
```
http://localhost:3000/api/v1
```

## 🔐 Autenticación

La API utiliza **JWT (JSON Web Tokens)** para autenticación.

### Headers requeridos:
```http
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

---

## 🔑 Auth Endpoints

### 1. Registrar Usuario
Crea una nueva cuenta de usuario.

```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "Ana López",
  "email": "ana.lopez@example.com",
  "phone": "+5491123456789",
  "password": "MiPassword123!",
  "roleId": "client-role-id"
}
```

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
      "id": "client-role-id",
      "name": "CLIENT",
      "description": "Cliente que puede agendar citas"
    },
    "createdAt": "2025-06-14T10:30:00.000Z",
    "updatedAt": "2025-06-14T10:30:00.000Z"
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
  "error": "CONFLICT"
}

// 400 - Datos inválidos
{
  "success": false,
  "message": "Password must be at least 8 characters long and contain uppercase, lowercase, and number",
  "error": "VALIDATION_ERROR"
}
```

---

### 2. Iniciar Sesión
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
        "id": "client-role-id",
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
  "error": "UNAUTHORIZED"
}
```

---

### 3. Renovar Token
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
      "id": "client-role-id",
      "name": "CLIENT",
      "description": "Cliente que puede agendar citas"
    },
    "createdAt": "2025-06-14T10:30:00.000Z",
    "updatedAt": "2025-06-14T10:30:00.000Z"
  },
  "message": "Profile retrieved successfully"
}
```

---

### 5. Actualizar Perfil
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
      "id": "client-role-id",
      "name": "CLIENT"
    },
    "updatedAt": "2025-06-14T11:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### 6. Cambiar Contraseña
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
  "error": "UNAUTHORIZED"
}

// 400 - Nueva contraseña inválida
{
  "success": false,
  "message": "New password must be at least 8 characters long and contain uppercase, lowercase, and number",
  "error": "VALIDATION_ERROR"
}
```

---

## 📋 Códigos de Estado HTTP

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

## 🔒 Roles de Usuario

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `ADMIN` | Administrador del sistema | Acceso completo |
| `STYLIST` | Estilista/Peluquero | Gestión de citas y servicios |
| `CLIENT` | Cliente | Agendar citas, ver perfil |

## 📝 Validaciones

### Password
- Mínimo 8 caracteres
- Al menos 1 mayúscula
- Al menos 1 minúscula  
- Al menos 1 número

### Email
- Formato válido (usuario@dominio.com)
- Único en el sistema

### Phone
- Formato internacional (+1234567890)
- Caracteres permitidos: +, números, espacios, guiones

## 🔧 Headers de Response

Todas las respuestas incluyen estos headers:

```http
Content-Type: application/json
X-Powered-By: Express
```

## 📊 Rate Limiting

- **Límite general:** 100 requests por minuto por IP
- **Login/Register:** 5 intentos por minuto por IP

## 🧪 Testing con cURL

### Registrar usuario:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Roberto Silva",
    "email": "roberto.silva@example.com",
    "phone": "+5491134567890",
    "password": "TestPass123!",
    "roleId": "client-role-id"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "roberto.silva@example.com",
    "password": "TestPass123!"
  }'
```

### Obtener perfil:
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🧪 Usuarios de Prueba (Seed Data)

Para testing rápido, puedes usar estos usuarios que se crean automáticamente con el seed:

### 👤 **Cliente de Prueba 1:**
```json
{
  "email": "maria@example.com",
  "password": "client123"
}
```

### 👤 **Cliente de Prueba 2:**
```json
{
  "email": "juan@example.com", 
  "password": "client123"
}
```

### 👨‍💼 **Administrador:**
```json
{
  "email": "admin@turnity.com",
  "password": "admin123"
}
```

### 💇‍♀️ **Estilista 1:**
```json
{
  "email": "lucia@turnity.com",
  "password": "stylist123"
}
```

### 💇‍♂️ **Estilista 2:**
```json
{
  "email": "carlos@turnity.com",
  "password": "stylist123"
}
```

---

## 📞 Soporte

Para dudas o problemas con la API:
- 📧 Email: dev@turnity.com
- 📖 Documentación: [docs/api/](./README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-repo/issues)