declare global {
  namespace NodeJS {
    // Solo DATABASE_URL, JWT_ACCESS_SECRET y JWT_REFRESH_SECRET son
    // realmente obligatorias (validado por src/shared/config/env.ts con Zod,
    // que hace process.exit(1) si faltan). El resto son opcionales -- o
    // porque env.ts les da un default (PORT, NODE_ENV, LOG_LEVEL, JWT_*_EXPIRY,
    // FRONTEND_URL), o porque ni siquiera forman parte del schema de Zod
    // (DB_*, MAIL_*, PGADMIN_*: solo las usa docker-compose.dev.yml para
    // configurar los contenedores, ningun codigo de la app las lee via
    // process.env directamente).
    interface ProcessEnv {
      // Server
      PORT?: string;
      NODE_ENV?: 'development' | 'production' | 'test';
      LOG_LEVEL?: string;

      // Database
      DB_HOST?: string;
      DB_PORT?: string;
      DB_USERNAME?: string;
      DB_PASSWORD?: string;
      DB_DATABASE?: string;
      DATABASE_URL: string;
      // Requerida solo para tests (ver tests/setup/jest.setup.ts), no forma
      // parte del schema de Zod de env.ts.
      TEST_DATABASE_URL?: string;

      // JWT
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRY?: string;
      JWT_REFRESH_EXPIRY?: string;

      // Mail (nodemailer esta instalado pero ningun servicio de mail esta
      // implementado todavia.
      MAIL_HOST?: string;
      MAIL_PORT?: string;
      MAIL_USER?: string;
      MAIL_PASSWORD?: string;
      MAIL_FROM?: string;

      // pgAdmin
      PGADMIN_DEFAULT_EMAIL?: string;
      PGADMIN_DEFAULT_PASSWORD?: string;

      // CORS
      FRONTEND_URL?: string;
    }
  }
}

export {};
