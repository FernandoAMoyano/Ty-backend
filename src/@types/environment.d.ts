declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      PORT: string;
      NODE_ENV: 'development' | 'production' | 'test';

      // Database
      DB_HOST: string;
      DB_PORT: string;
      DB_USERNAME: string;
      DB_PASSWORD: string;
      DB_DATABASE: string;
      DATABASE_URL: string;
      TEST_DATABASE_URL: string;

      // JWT
      JWT_ACCESS_SECRET: string;
      JWT_REFRESH_SECRET: string;
      JWT_ACCESS_EXPIRY: string;
      JWT_REFRESH_EXPIRY: string;

      // Mail
      MAIL_HOST: string;
      MAIL_PORT: string;
      MAIL_USER: string;
      MAIL_PASSWORD: string;
      MAIL_FROM: string;

      // pgAdmin
      PGADMIN_DEFAULT_EMAIL: string;
      PGADMIN_DEFAULT_PASSWORD: string;

      // CORS
      FRONTEND_URL: string;
    }
  }
}

export {};
