# 💇‍♀️ Turnity Backend


Backend API para sistema de gestión de salones de belleza construido con **Node.js**, **TypeScript**, **Express** y **Prisma**.

# Índice


1. [Inicio Rápido](#-inicio-rápido)
2. [Scripts disponibles](#-scripts-disponibles)
3. [Arquitectura](#️-arquitectura)
4. [Api Endpoints](#-api-endpoints)
5. [Testing](#-testing)
6. [Base de Datos](#️-base-de-datos)
7. [Desarrollo local](#-desarrollo-local)
8. [Tecnologias](#-tecnologías)
9. [Contribuir](#-contribuir)
10. [Licencia](#-licencia)

# 🚀 Inicio Rápido

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
# 📋 Scripts Disponibles



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

# 🏗️ Arquitectura

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

# 🔐 API Endpoints

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
GET    /api/v1/categories                    # Obtener todas las categorías
GET    /api/v1/categories/active             # Obtener categorías activas
GET    /api/v1/categories/:id                # Obtener categoría por ID
POST   /api/v1/categories                    # Crear categoría (ADMIN)
PUT    /api/v1/categories/:id                # Actualizar categoría (ADMIN)
PATCH  /api/v1/categories/:id/activate       # Activar categoría (ADMIN)
PATCH  /api/v1/categories/:id/deactivate     # Desactivar categoría (ADMIN)
DELETE /api/v1/categories/:id                # Eliminar categoría (ADMIN)
```

### Servicios 
```
GET    /api/v1/services                             # Obtener todos los servicios
GET    /api/v1/services/active                      # Obtener servicios activos
GET    /api/v1/services/:id                         # Obtener servicio por ID
GET    /api/v1/services/category/:categoryId        # Obtener servicios por categoría
GET    /api/v1/services/category/:categoryId/active # Obtener servicios activos por categoría
POST   /api/v1/services                             # Crear servicio (ADMIN)
PUT    /api/v1/services/:id                         # Actualizar servicio (ADMIN)
PATCH  /api/v1/services/:id/activate                # Activar servicio (ADMIN)
PATCH  /api/v1/services/:id/deactivate              # Desactivar servicio (ADMIN)
DELETE /api/v1/services/:id                         # Eliminar servicio (ADMIN)
```

### Servicios en relacion con estilistas 
```
GET    /api/v1/stylists/:stylistId/services            # Obtener servicios del estilista
GET    /api/v1/stylists/:stylistId/services/active     # Obtener servicios activos del estilista
GET    /api/v1/stylists/:stylistId/services/detailed   # Vista detallada del estilista con servicios
GET    /api/v1/services/:serviceId/stylists            # Obtener estilistas del servicio
GET    /api/v1/services/:serviceId/stylists/offering   # Obtener estilistas que ofrecen el servicio
GET    /api/v1/services/:serviceId/stylists/detailed   # Vista detallada del servicio con estilistas
POST   /api/v1/stylists/:stylistId/services            # Asignar servicio a estilista (ADMIN/STYLIST)
PUT    /api/v1/stylists/:stylistId/services/:serviceId # Actualizar servicio del estilista (ADMIN/STYLIST)
DELETE /api/v1/stylists/:stylistId/services/:serviceId # Remover servicio del estilista (ADMIN/STYLIST)
```

# 🧪 Testing

[Índice](#índice)

El proyecto tiene **83 tests** con cobertura completa:

- ✅ **Tests unitarios** - Entities, Services
- ✅ **Tests de integración** - API endpoints  
- ✅ **Tests E2E** - Flujos completos

```bash
# Ejecutar todos los tests
npm run docker:jest:test

# Tests específicos
npm run docker:jest:test -- tests/integration/auth/login.integration.test.ts
```

[Índice](#índice)

## 🗄️ Base de Datos



### Estructura principal:
- **Users** - Usuarios del sistema
- **Roles** - Roles (ADMIN, CLIENT, STYLIST)

### Comandos útiles:
```bash
# Ver base de datos visualmente
npm run docker:db:prisma:studio

# Reset completo de BD
npm run docker:db:prisma:reset
```

# 🔧 Desarrollo Local

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

# 📚 Tecnologías

[Índice](#índice)


- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js  
- **Base de datos:** PostgreSQL + Prisma ORM
- **Autenticación:** JWT
- **Testing:** Jest + Supertest
- **Containerización:** Docker + Docker Compose
- **Arquitectura:** Clean Architecture + DDD

# 🤝 Contribuir

[Índice](#índice)


1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit: `git commit -m 'Add nueva feature'`
4. Push: `git push origin feature/nueva-feature`
5. Abre un Pull Request

## 📄 Licencia

[Índice](#índice)

