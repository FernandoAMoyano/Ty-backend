# 💇‍♀️ Turnity Backend

Backend API para sistema de gestión de salones de belleza construido con **Node.js**, **TypeScript**, **Express** y **Prisma**.

# 🟣Índice

1. [Inicio Rápido](#-inicio-rápido)
2. [Scripts disponibles](#-scripts-disponibles)
3. [Arquitectura](#️-arquitectura)
4. [Documentación API](#-documentación-api)
5. [API Endpoints](#-api-endpoints)
6. [Testing](#-testing)
7. [Base de Datos](#️-base-de-datos)
8. [Desarrollo local](#-desarrollo-local)
9. [Tecnologias](#-tecnologías)
10. [Contribuir](#-contribuir)
11. [Licencia](#-licencia)

# 🟣Inicio Rápido

[Índice](#índice)

### Prerrequisitos
- **Docker** y **Docker Compose**
- **Node.js 18+** (opcional, para desarrollo local)

### 1. Clonar el repositorio
```bash
git clone <tu-repo-url>
cd Turnity-backend
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/turnity"
JWT_SECRET="tu-jwt-secret-super-seguro"
JWT_REFRESH_SECRET="tu-refresh-secret-super-seguro"
```

### 3. Levantar el proyecto con Docker
```bash
# Construir e iniciar todos los servicios
npm run docker:up

# Ejecutar migraciones y seed
npm run docker:db:prisma:migrate
npm run docker:db:prisma:seed
```

### 4. Verificar que funciona


La API estará disponible en: **http://localhost:3000**
Endpoint de salud: **GET http://localhost:3000/health**

[Índice](#índice)

# 🟣Scripts Disponibles

### Docker (Recomendado)
```bash
npm run docker:up              # Levantar todos los servicios
npm run docker:down            # Detener todos los servicios
npm run docker:dev:build       # Construir imagen de desarrollo
npm run docker:jest:test       # Ejecutar tests en Docker
```

### Base de datos PostgreSQL
```bash
npm run docker:db:prisma:migrate    # Ejecutar migraciones
npm run docker:db:prisma:seed       # Ejecutar seed inicial
npm run docker:db:prisma:studio     # Abrir Prisma Studio
```

### Tests
```bash
npm run docker:jest:test        # Todos los tests
npm run test                    # Tests locales (requiere DB)
```

# 🟣Arquitectura

[Índice](#índice)

El proyecto sigue **Clean Architecture** con estas capas:

```
src/modules/[module]/
├── presentation/     # Controllers, Routes, DTOs
├── application/      # Use Cases, Services  
├── domain/           # Entities, Repository Interfaces
├── infrastructure/   # DB, External Services
└── container.ts      # Dependency Injection
```

# 🟣Documentación API

[Índice](#índice)

### Enlaces de Documentación

| Recurso | URL | Descripción |
|---------|-----|-------------|
| **Swagger UI** | [http://localhost:3000/api/docs](http://localhost:3000/api/docs) | Documentación interactiva completa |
| **API Info** | [http://localhost:3000/api/info](http://localhost:3000/api/info) | Información básica de la API |
| **OpenAPI JSON** | [http://localhost:3000/api/docs.json](http://localhost:3000/api/docs.json) | Especificación OpenAPI en formato JSON |
| **Health Check** | [http://localhost:3000/health](http://localhost:3000/health) | Estado de salud del servicio |

### Colecciones de Testing

| Herramienta | Archivo | Descripción |
|-------------|---------|-------------|
| **Postman** | `docs/auth_postman_collection.json` | Colección de endpoints de autenticación |
| **Postman** | `docs/services_postman_collection.json` | Colección de endpoints de servicios |

### Cómo usar la documentación

1. **Desarrollo**: Usa Swagger UI para probar endpoints interactivamente
2. **Testing**: Importa las colecciones de Postman para pruebas rápidas
3. **Integración**: Usa el JSON de OpenAPI para generar clientes automáticamente

# 🟣API Endpoints

[Índice](#índice)

### Autenticación
```
POST   /api/v1/auth/register        # Registrar usuario
POST   /api/v1/auth/login           # Iniciar sesión  
POST   /api/v1/auth/refresh-token   # Renovar token
GET    /api/v1/auth/profile         # Obtener perfil
PUT    /api/v1/auth/profile         # Actualizar perfil
PUT    /api/v1/auth/change-password # Cambiar contraseña
```

### Categorias 
```
GET    /api/v1/services/categories                    # Obtener todas las categorías
GET    /api/v1/services/categories/active             # Obtener categorías activas
GET    /api/v1/services/categories/:id                # Obtener categoría por ID
POST   /api/v1/services/categories                    # Crear categoría (ADMIN)
PUT    /api/v1/services/categories/:id                # Actualizar categoría (ADMIN)
PATCH  /api/v1/services/categories/:id/activate       # Activar categoría (ADMIN)
PATCH  /api/v1/services/categories/:id/deactivate     # Desactivar categoría (ADMIN)
DELETE /api/v1/services/categories/:id                # Eliminar categoría (ADMIN)
```

### Servicios 
```
GET    /api/v1/services/services                             # Obtener todos los servicios
GET    /api/v1/services/services/active                      # Obtener servicios activos
GET    /api/v1/services/services/:id                         # Obtener servicio por ID
GET    /api/v1/services/services/category/:categoryId        # Obtener servicios por categoría
GET    /api/v1/services/services/category/:categoryId/active # Obtener servicios activos por categoría
POST   /api/v1/services/services                             # Crear servicio (ADMIN)
PUT    /api/v1/services/services/:id                         # Actualizar servicio (ADMIN)
PATCH  /api/v1/services/services/:id/activate                # Activar servicio (ADMIN)
PATCH  /api/v1/services/services/:id/deactivate              # Desactivar servicio (ADMIN)
DELETE /api/v1/services/services/:id                         # Eliminar servicio (ADMIN)
```

### Servicios en relación con estilistas 
```
GET    /api/v1/services/stylists/:stylistId/services            # Obtener servicios del estilista
GET    /api/v1/services/stylists/:stylistId/services/active     # Obtener servicios activos del estilista
GET    /api/v1/services/stylists/:stylistId/services/detailed   # Vista detallada del estilista con servicios
GET    /api/v1/services/services/:serviceId/stylists            # Obtener estilistas del servicio
GET    /api/v1/services/services/:serviceId/stylists/offering   # Obtener estilistas que ofrecen el servicio
GET    /api/v1/services/services/:serviceId/stylists/detailed   # Vista detallada del servicio con estilistas
POST   /api/v1/services/stylists/:stylistId/services            # Asignar servicio a estilista (ADMIN/STYLIST)
PUT    /api/v1/services/stylists/:stylistId/services/:serviceId # Actualizar servicio del estilista (ADMIN/STYLIST)
DELETE /api/v1/services/stylists/:stylistId/services/:serviceId # Remover servicio del estilista (ADMIN/STYLIST)
```

# 🟣Testing

[Índice](#índice)


- **Tests unitarios** - Entities, Services
- **Tests de integración** - API endpoints  
- **Tests E2E** - Flujos completos

```bash
# Ejecutar todos los tests
npm run docker:jest:test

# Tests específicos
npm run docker:jest:test -- tests/integration/auth/login.integration.test.ts
```

# 🟣Base de Datos

[Índice](#índice)

### Entidades Implementadas 

| Entidad | Descripción |
|---------|-------------|
| **User** | Usuarios del sistema con roles diferenciados |
| **Role** | Roles del sistema (ADMIN, CLIENT, STYLIST) |
| **Category** | Categorías de servicios (ej: Corte, Coloración) |
| **Service** | Servicios ofrecidos con precios y duración |
| **StylistService** | Relación estilista-servicio con precios personalizados |
| **Client** | Perfil extendido para clientes |
| **Stylist** | Perfil extendido para estilistas |

### Sistema de Citas (en construcción)

| Entidad | Descripción |
|---------|-------------|
| **Appointment** | Citas entre clientes y estilistas |
| **AppointmentStatus** | Estados de citas (Pendiente, Confirmada, Completada) |
| **Schedule** | Horarios de disponibilidad por día de semana |
| **Holiday** | Días festivos y fechas especiales |
| **ScheduleException** | Excepciones de horario para fechas específicas |

### Sistema de Pagos (en construcción)

| Entidad | Descripción |
|---------|-------------|
| **Payment** | Pagos de citas con múltiples métodos |

### Sistema de Notificaciones (en construcción)

| Entidad | Descripción |
|---------|-------------|
| **Notification** | Notificaciones del sistema |
| **NotificationStatus** | Estados de notificaciones (Enviada, Leída, etc.) |

### Comandos útiles:
```bash
# Ver base de datos visualmente
npm run docker:db:prisma:studio

# Reset completo de BD
npm run docker:db:prisma:reset
```

# 🟣Desarrollo Local

[Índice](#índice)

Si prefieres desarrollo sin Docker:

```bash
# Instalar dependencias
npm install

# Configurar base de datos local
# (Asegúrate de tener PostgreSQL corriendo)

# Ejecutar migraciones
npx prisma migrate deploy
npx prisma db seed

# Modo desarrollo
npm run dev
```

# 🟣Tecnologías

[Índice](#índice)

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js  
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT
- **Testing:** Jest + Supertest
- **Containerización:** Docker + Docker Compose
- **Arquitectura:** Clean Architecture + DDD

# 🟣Contribuir

[Índice](#índice)

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Abre un Pull Request

# 🟣Licencia

[Índice](#índice)