![CI](https://github.com/FernandoAMoyano/Ty-backend/actions/workflows/ci.yml/badge.svg?branch=main)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000.svg?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1.svg?logo=postgresql&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-1118%2B%20passing-brightgreen.svg)

# 💇‍♀️ Turnity Backend

Backend API para sistema de gestión de salones de belleza construido con **Node.js**, **TypeScript**, **Express** y **Prisma ORM**.

Implementa **Clean Architecture**, **DDD táctico** y **Arquitectura Hexagonal** (Ports & Adapters) con 7 módulos de negocio, 1118+ tests automatizados y documentación Swagger interactiva.

---

## Índice

1. [Inicio Rápido](#inicio-rápido)
2. [Scripts Disponibles](#scripts-disponibles)
3. [Arquitectura](#arquitectura)
4. [Documentación API](#documentación-api)
5. [API Endpoints](#api-endpoints)
6. [Testing](#testing)
7. [Base de Datos](#base-de-datos)
8. [Desarrollo Local](#desarrollo-local)
9. [Tecnologías](#tecnologías)
10. [Contribuir](#contribuir)
11. [Licencia](#licencia)

---

## Inicio Rápido

[Índice](#índice)

### Prerrequisitos

- **Docker** y **Docker Compose**
- **Node.js 18+** (opcional, para desarrollo local sin Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/FernandoAMoyano/Ty-backend.git
cd Turnity-backend
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con los valores correspondientes:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/turnity?schema=public"
JWT_ACCESS_SECRET="tu-jwt-access-secret"
JWT_REFRESH_SECRET="tu-jwt-refresh-secret"
```

### 3. Levantar el proyecto con Docker

```bash
# Construir e iniciar todos los servicios
npm run docker:dev:up

# Ejecutar migraciones
npm run docker:prisma:migrate:dev

# Ejecutar seed inicial
npm run docker:db:prisma:seed
```

### 4. Verificar que funciona

La API estará disponible en **http://localhost:3000**

```bash
curl http://localhost:3000/health
```

---

## Scripts Disponibles

[Índice](#índice)

### Docker

```bash
npm run docker:dev:build          # Construir imagen de desarrollo
npm run docker:dev:up             # Levantar todos los servicios
npm run docker:dev:down           # Detener todos los servicios
npm run docker:clean              # Limpiar imágenes y contenedores
```

### Base de datos (dentro del contenedor Docker)

```bash
npm run docker:prisma:migrate:dev       # Ejecutar migraciones
npm run docker:db:prisma:seed           # Ejecutar seed inicial
npm run docker:db:reset                 # Reset completo de BD
npm run docker:generate:prisma:client   # Regenerar cliente Prisma
```

### Tests

```bash
npm run docker:jest:test                # Ejecutar todos los tests en Docker
npm run docker:jest:test:watch          # Tests en modo watch en Docker
npm run test                            # Tests locales (requiere DB activa)
npm run test:watch                      # Tests locales en modo watch
```

### Desarrollo local (sin Docker)

```bash
npm run dev                       # Servidor de desarrollo con hot-reload
npm run build                     # Compilar TypeScript
npm run start                     # Iniciar servidor compilado
npm run lint                      # Ejecutar ESLint
npm run lint:fix                  # Corregir errores de lint
npm run format                    # Formatear con Prettier
```

### Prisma (local)

```bash
npm run prisma:studio             # Abrir Prisma Studio (GUI de BD)
npm run prisma:migrate:dev        # Crear y ejecutar migración
npm run prisma:migrate:deploy     # Ejecutar migraciones pendientes
npm run prisma:migrate:status     # Ver estado de migraciones
npm run prisma:db:seed            # Ejecutar seed
npm run prisma:generate           # Regenerar cliente Prisma
npm run prisma:format             # Formatear schema.prisma
```

---

## Arquitectura

[Índice](#índice)

El proyecto sigue **Clean Architecture** con **DDD táctico** y **Arquitectura Hexagonal**:

### Diagrama de módulos y dependencias

```mermaid
graph TB
    subgraph Presentation["Presentation Layer"]
        Routes[Routes & Middleware]
        Controllers[Controllers]
    end

    subgraph Application["Application Layer"]
        UseCases[Use Cases]
        DTOs[DTOs]
    end

    subgraph Domain["Domain Layer"]
        Entities[Entities]
        Ports[Repository Interfaces - Ports]
        DomainServices[Domain Services]
    end

    subgraph Infrastructure["Infrastructure Layer"]
        Adapters[Prisma Repositories - Adapters]
        DB[(PostgreSQL)]
    end

    Routes --> Controllers
    Controllers --> UseCases
    UseCases --> Ports
    UseCases --> DomainServices
    DomainServices --> Ports
    Adapters -.->|implements| Ports
    Adapters --> DB

    subgraph Modules["Business Modules"]
        Auth["auth\nLogin, JWT, Roles\nDesactivación + cascada"]
        Services["services\nCategorías, Servicios\nEstilistas, Asignaciones"]
        Appointments["appointments\nCitas, Schedules, Slots\nConfirmación, Cancelación"]
        Holidays["holidays\nFeriados, Excepciones\nAuto-cancel de citas"]
        Payments["payments\nPagos, Reembolsos\nEstadísticas"]
        Notifications["notifications\nAlertas del sistema"]
    end

    Holidays -->|ScheduleAvailabilityService| Appointments
    Auth -->|DeactivateUser cascade| Appointments
    Auth -->|DeactivateUser cascade| Services
    Payments -->|verifica estado| Appointments
```

### Estructura de un módulo

```
src/modules/[module]/
├── domain/           # Entidades, interfaces de repositorios (ports)
├── application/      # Use Cases (casos de uso individuales)
├── infrastructure/   # Implementaciones de repositorios (adapters), Prisma
├── presentation/     # Controllers, Routes, Validations, Middlewares
└── [Module]Container.ts  # Inyección de dependencias
```

### Convenciones principales

- Controllers delegan directamente a use cases individuales (sin capa intermedia de application service)
- Excepciones tipadas (`ValidationError`, `NotFoundError`, `ConflictError`, `BusinessRuleError`, `UnauthorizedError`, `ForbiddenError`) en lugar de `try/catch` genéricos
- Interfaces de repositorios con prefijo `I` (`IUserRepository`, `ICategoryRepository`)
- UUIDs generados con `generateUuid()` desde `src/shared/utils/uuid.ts`
- Validación centralizada via `ValidationMiddleware` en `src/shared/middleware/`
- Mensajes de error de API en inglés; JSDoc en español

> La guía completa de convenciones está en `src/docs/SKILL.md`

---

## Documentación API

[Índice](#índice)

### Documentación interactiva

| Recurso          | URL                                 | Descripción                            |
| ---------------- | ----------------------------------- | -------------------------------------- |
| **Swagger UI**   | http://localhost:3000/api/docs      | Documentación interactiva completa     |
| **API Info**     | http://localhost:3000/api/info      | Información básica de la API           |
| **OpenAPI JSON** | http://localhost:3000/api/docs.json | Especificación OpenAPI en formato JSON |
| **Health Check** | http://localhost:3000/health        | Estado de salud del servicio           |

### Colecciones Postman

| Módulo         | Archivo                                                  |
| -------------- | -------------------------------------------------------- |
| Authentication | `src/docs/postman/auth_postman_collection.json`          |
| Services       | `src/docs/postman/services_postman_collection.json`      |
| Appointments   | `src/docs/postman/appointments_postman_collection.json`  |
| Holidays       | `src/docs/postman/holidays_postman_collection.json`      |
| Notifications  | `src/docs/postman/notifications_postman_collection.json` |
| Payments       | `src/docs/postman/payments_postman_collection.json`      |

### Documentación de reglas de negocio

Las reglas de negocio de cada módulo están documentadas en `src/docs/business-rules/`:

```
src/docs/business-rules/
├── 01-auth.md
├── 02-categories.md
├── 03-services.md
├── 04-stylists.md
├── 05-schedules.md
├── 06-appointments.md
├── 07-notifications.md
├── 08-payments.md
└── 09-holidays.md
```

---

## API Endpoints

[Índice](#índice)

Base URL: `http://localhost:3000/api/v1`

### Authentication

```
POST   /auth/register              # Registrar usuario
POST   /auth/login                 # Iniciar sesión
POST   /auth/refresh-token         # Renovar token
GET    /auth/profile               # Obtener perfil (autenticado)
PUT    /auth/profile               # Actualizar perfil (autenticado)
PUT    /auth/change-password       # Cambiar contraseña (autenticado)
PATCH  /auth/users/:id/deactivate  # Desactivar usuario (ADMIN)
```

### Categories

```
GET    /categories                 # Obtener todas las categorías
GET    /categories/active          # Obtener categorías activas
GET    /categories/:id             # Obtener categoría por ID
POST   /categories                 # Crear categoría (ADMIN)
PUT    /categories/:id             # Actualizar categoría (ADMIN)
PATCH  /categories/:id/activate    # Activar categoría (ADMIN)
PATCH  /categories/:id/deactivate  # Desactivar categoría (ADMIN)
DELETE /categories/:id             # Eliminar categoría (ADMIN)
```

### Services

```
GET    /services                               # Obtener todos los servicios
GET    /services/active                        # Obtener servicios activos
GET    /services/:id                           # Obtener servicio por ID
GET    /services/category/:categoryId          # Servicios por categoría
GET    /services/category/:categoryId/active   # Servicios activos por categoría
POST   /services                               # Crear servicio (ADMIN)
PUT    /services/:id                           # Actualizar servicio (ADMIN)
PATCH  /services/:id/activate                  # Activar servicio (ADMIN)
PATCH  /services/:id/deactivate                # Desactivar servicio (ADMIN)
DELETE /services/:id                           # Eliminar servicio (ADMIN)
```

### Stylist Services

```
GET    /services/stylists/:stylistId/services              # Servicios del estilista
GET    /services/stylists/:stylistId/services/active       # Servicios activos del estilista
GET    /services/stylists/:stylistId/services/detailed     # Estilista con servicios detallados
GET    /services/:serviceId/stylists                       # Estilistas de un servicio
GET    /services/:serviceId/stylists/offering              # Estilistas que ofrecen el servicio
GET    /services/:serviceId/stylists/detailed              # Servicio con estilistas detallados
POST   /services/stylists/:stylistId/services              # Asignar servicio (ADMIN/STYLIST)
PUT    /services/stylists/:stylistId/services/:serviceId   # Actualizar asignación (ADMIN/STYLIST)
DELETE /services/stylists/:stylistId/services/:serviceId   # Remover asignación (ADMIN/STYLIST)
```

### Appointments

```
POST   /appointments                           # Crear nueva cita (autenticado)
GET    /appointments/available-slots           # Obtener slots disponibles (público)
GET    /appointments/client/:clientId          # Citas de un cliente (autenticado)
GET    /appointments/stylist/:stylistId        # Citas de un estilista (autenticado)
GET    /appointments/:id                       # Obtener cita por ID (autenticado)
PUT    /appointments/:id                       # Actualizar cita (autenticado)
POST   /appointments/:id/confirm               # Confirmar cita (autenticado)
POST   /appointments/:id/cancel                # Cancelar cita (autenticado)
```

### Payments

```
GET    /payments                               # Listar pagos paginados (ADMIN)
POST   /payments                               # Crear pago (ADMIN/STYLIST)
GET    /payments/statistics                    # Estadísticas de pagos (ADMIN)
GET    /payments/appointment/:appointmentId    # Pagos de una cita (ADMIN/STYLIST)
GET    /payments/:id                           # Obtener pago por ID (ADMIN/STYLIST)
PUT    /payments/:id                           # Actualizar monto (ADMIN)
POST   /payments/:id/process                   # Procesar pago (ADMIN/STYLIST)
POST   /payments/:id/refund                    # Reembolsar pago (ADMIN)
POST   /payments/:id/cancel                    # Cancelar pago (ADMIN/STYLIST)
```

### Holidays

```
GET    /holidays                               # Listar feriados (público)
POST   /holidays                               # Crear feriado (ADMIN)
GET    /holidays/upcoming                      # Próximos feriados (público)
GET    /holidays/check/:date                   # Verificar si fecha es feriado (público)
GET    /holidays/year/:year                    # Feriados por año (público)
GET    /holidays/:id                           # Obtener feriado por ID (público)
PUT    /holidays/:id                           # Actualizar feriado (ADMIN)
DELETE /holidays/:id                           # Eliminar feriado (ADMIN)
```

### Schedule Exceptions

```
GET    /holidays/exceptions                    # Listar excepciones (público)
POST   /holidays/exceptions                    # Crear excepción (ADMIN)
GET    /holidays/exceptions/upcoming           # Próximas excepciones (público)
GET    /holidays/exceptions/:id                # Obtener excepción por ID (público)
PUT    /holidays/exceptions/:id                # Actualizar excepción (ADMIN)
DELETE /holidays/exceptions/:id                # Eliminar excepción (ADMIN)
GET    /holidays/:holidayId/exceptions         # Excepciones de un feriado (público)
```

### Notifications

```
GET    /notifications                          # Notificaciones del usuario (autenticado)
POST   /notifications                          # Crear notificación (ADMIN)
GET    /notifications/unread-count             # Conteo de no leídas (autenticado)
POST   /notifications/mark-read                # Marcar como leídas (autenticado)
POST   /notifications/mark-all-read            # Marcar todas como leídas (autenticado)
GET    /notifications/:id                      # Obtener por ID (autenticado)
PATCH  /notifications/:id/read                 # Marcar una como leída (autenticado)
```

---

## Testing

[Índice](#índice)

El proyecto cuenta con **1118+ tests** organizados en tres niveles:

### Estructura de tests

```
tests/
├── unit/                  # Tests unitarios (entidades y use cases)
│   ├── auth/              # 6 tests: User, Role, AuthService, BcryptHash, JwtToken, DeactivateUser
│   ├── services/          # 6 tests: Category, Service, StylistService + UseCases
│   ├── appointments/      # 12 tests: 3 entidades + 8 use cases + ScheduleAvailabilityService
│   ├── holidays/          # 12 tests: 2 entidades + 10 use cases
│   ├── notifications/     # 7 tests: 2 entidades + 5 use cases
│   ├── payments/          # 9 tests: 1 entidad + 8 use cases
│   └── shared/            # 1 test: ValidationMiddleware
├── integration/           # Tests de integración (API endpoints)
│   ├── auth/              # 5 tests: login, register, profile, refresh-token, change-password
│   ├── services/          # 3 tests: categories, services, stylist-services
│   ├── appointments/      # 3 tests: repositorios (Appointment, Status, Schedule)
│   ├── holidays/          # 1 test: holiday-routes
│   ├── notifications/     # 1 test: notification-routes
│   └── payments/          # 1 test: payment-routes
└── e2e/                   # Tests end-to-end (flujos completos)
    ├── auth-complete-flow.e2e.test.ts
    ├── services-complete-flow.e2e.test.ts
    ├── appointments-complete-flow.e2e.test.ts
    ├── holidays-complete-flow.e2e.test.ts
    ├── notifications-complete-flow.e2e.test.ts
    └── payments-complete-flow.e2e.test.ts
```

### Ejecución de tests

```bash
# Todos los tests (en Docker)
npm run docker:jest:test

# Todos los tests (local, requiere DB activa)
npm test

# Test específico
npm test -- tests/integration/auth/login.integration.test.ts

# Tests por patrón de nombre
npm test -- --testNamePattern="should login successfully"

# Cobertura
npm test -- --coverage
```

### Estrategia de aislamiento

Los tests utilizan la misma base de datos de desarrollo con limpieza selectiva por convención: usuarios de test se identifican por `'test'` en el email, statuses de test por prefijo `'TEST_'`, y helpers dedicados gestionan la creación y limpieza de datos en cada módulo.

---

## Base de Datos

[Índice](#índice)

### Entidades

| Entidad                | Módulo        | Descripción                                                                             |
| ---------------------- | ------------- | --------------------------------------------------------------------------------------- |
| **User**               | auth          | Usuarios del sistema con roles diferenciados (incluye `preferences` opcional)           |
| **Role**               | auth          | Roles del sistema (ADMIN, CLIENT, STYLIST)                                              |
| **Category**           | services      | Categorías de servicios (ej: Corte, Coloración)                                         |
| **Service**            | services      | Servicios ofrecidos con precios y duración                                              |
| **StylistService**     | services      | Relación estilista-servicio con precios personalizados (`stylistId` apunta a `User.id`) |
| **Appointment**        | appointments  | Citas entre clientes y estilistas                                                       |
| **AppointmentStatus**  | appointments  | Estados de citas (Pendiente, Confirmada, Completada, Cancelada)                         |
| **Schedule**           | appointments  | Horarios de disponibilidad por día de semana                                            |
| **Holiday**            | holidays      | Días festivos y fechas especiales                                                       |
| **ScheduleException**  | holidays      | Excepciones de horario para fechas específicas                                          |
| **Payment**            | payments      | Pagos de citas con múltiples métodos y estados                                          |
| **Notification**       | notifications | Notificaciones del sistema (citas, promociones, sistema)                                |
| **NotificationStatus** | notifications | Estados de notificaciones (Enviada, Leída)                                              |

### Comandos útiles

```bash
# Ver base de datos visualmente (Prisma Studio)
npm run prisma:studio

# Reset completo de BD (Docker)
npm run docker:db:reset
```

---

## Desarrollo Local

[Índice](#índice)

Para desarrollo sin Docker (requiere PostgreSQL instalado localmente):

```bash
# Instalar dependencias
npm install

# Configurar .env con DATABASE_URL apuntando a tu PostgreSQL local

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Ejecutar seed inicial
npx prisma db seed

# Iniciar en modo desarrollo (hot-reload)
npm run dev
```

La API estará disponible en **http://localhost:3000** con la documentación Swagger en **http://localhost:3000/api/docs**.

---

## Tecnologías

[Índice](#índice)

| Categoría            | Tecnología                                   |
| -------------------- | -------------------------------------------- |
| **Runtime**          | Node.js 18+ · TypeScript 5.x                 |
| **Framework**        | Express 5.x                                  |
| **Base de datos**    | PostgreSQL 14+ · Prisma ORM                  |
| **Autenticación**    | JWT (access + refresh tokens) · bcrypt       |
| **Validación**       | express-validator                            |
| **Documentación**    | Swagger/OpenAPI 3.0 · swagger-ui-express     |
| **Testing**          | Jest · Supertest                             |
| **Containerización** | Docker · Docker Compose                      |
| **Seguridad**        | Helmet · CORS                                |
| **Utilidades**       | date-fns · uuid · morgan · nodemailer        |
| **Arquitectura**     | Clean Architecture · DDD táctico · Hexagonal |

---

## Contribuir

[Índice](#índice)

1. Fork el proyecto
2. Crear una rama: `git checkout -b feature/nueva-feature`
3. Commit con conventional commits: `git commit -m "feat: agregar nueva feature"`
4. Push: `git push origin feature/nueva-feature`
5. Abrir un Pull Request hacia `develop`

---

## Licencia

[Índice](#índice)

Este proyecto está licenciado bajo la **Licencia MIT** — consultar el archivo [LICENSE](LICENSE) para más detalles.

© 2025 Fernando Moyano. Todos los derechos reservados.
