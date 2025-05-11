turnity-backend/
├── src/
│   ├── api/                      # Organización por dominios/módulos
│   │   ├── appointments/         # Todo lo relacionado con citas
│   │   │   ├── controllers/      # Controladores de API para citas
│   │   │   ├── dto/              # DTOs específicos de citas
│   │   │   ├── services/         # Lógica de negocio para citas
│   │   │   ├── repositories/     # Acceso a datos para citas
│   │   │   ├── routes.ts         # Rutas para el módulo de citas
│   │   │   └── index.ts          # Punto de entrada para el módulo
│   │   │
│   │   ├── users/                # Todo lo relacionado con usuarios
│   │   │   ├── controllers/
│   │   │   ├── dto/
│   │   │   ├── services/
│   │   │   ├── repositories/
│   │   │   ├── routes.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── services/             # Servicios de peluquería
│   │   ├── schedules/            # Horarios y excepciones
│   │   ├── notifications/        # Sistema de notificaciones
│   │   └── payments/             # Gestión de pagos
│   │
│   ├── config/                   # Configuraciones
│   │   ├── database.ts           # Configuración de base de datos
│   │   ├── server.ts             # Configuración del servidor
│   │   ├── logger.ts             # Configuración de logging
│   │   ├── mail.ts               # Configuración de correo
│   │   └── index.ts              # Exporta todas las configuraciones
│   │
│   ├── core/                     # Componentes centrales del sistema
│   │   ├── types/                # Interfaces y tipos globales
│   │   │   ├── interfaces.ts     # Interfaces principales
│   │   │   ├── enums.ts          # Enumeraciones
│   │   │   └── utils.ts          # Tipos de utilidad
│   │   │
│   │   ├── middlewares/          # Middlewares de Express
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── exceptions/           # Excepciones personalizadas
│   │   │   ├── http.exception.ts
│   │   │   ├── validation.exception.ts
│   │   │   └── index.ts
│   │   │
│   │   └── decorators/           # Decoradores personalizados (opcional)
│   │
│   ├── utils/                    # Utilidades generales
│   │   ├── validation.ts         # Funciones de validación
│   │   ├── date.ts               # Funciones para manejo de fechas
│   │   ├── security.ts           # Utilidades de seguridad
│   │   └── pagination.ts         # Utilidades para paginación
│   │
│   ├── database/                 # Todo lo relacionado con la base de datos
│   │   ├── migrations/           # Migraciones de TypeORM
│   │   ├── seeders/              # Scripts para datos iniciales
│   │   ├── entities/             # Entidades de TypeORM
│   │   └── repositories/         # Repositorios base (si los hay)
│   │
│   ├── services/                 # Servicios compartidos/globales
│   │   ├── mail.service.ts       # Servicio de correo
│   │   ├── storage.service.ts    # Servicio para almacenamiento de archivos
│   │   ├── cache.service.ts      # Servicio de caché
│   │   └── logger.service.ts     # Servicio de logging
│   │
│   ├── routes/                   # Enrutador principal de la aplicación
│   │   ├── v1.routes.ts          # Rutas de la API v1
│   │   └── index.ts              # Exporta todas las rutas
│   │
│   ├── app.ts                    # Configuración de la aplicación Express
│   └── server.ts                 # Punto de entrada de la aplicación
│
├── tests/                        # Pruebas
│   ├── unit/                     # Pruebas unitarias
│   ├── integration/              # Pruebas de integración
│   ├── e2e/                      # Pruebas end-to-end
│   └── fixtures/                 # Datos de prueba
│
├── dist/                         # Código compilado (generado)
├── logs/                         # Archivos de registro
├── uploads/                      # Archivos subidos (si aplica)
├── docs/                         # Documentación
│   ├── api/                      # Documentación de la API
│   └── architecture/             # Documentación de la arquitectura
│
├── .env                          # Variables de entorno para desarrollo
├── .env.example                  # Ejemplo de variables de entorno
├── .gitignore                    # Archivos ignorados por Git
├── tsconfig.json                 # Configuración de TypeScript
├── package.json                  # Dependencias y scripts
├── nodemon.json                  # Configuración de Nodemon para desarrollo
├── jest.config.js                # Configuración de Jest para pruebas
└── README.md                     # Documentación principal
