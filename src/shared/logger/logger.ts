import fs from 'fs';
import path from 'path';
import winston from 'winston';

/**
 * Directorio de salida para los archivos de log
 * Esta en .gitignore, por lo que no existe garantizado en un checkout
 * limpio (CI, clon nuevo del repo, etc.) -- se crea de forma defensiva
 * al cargar este modulo, antes de instanciar los transports de archivo.
 */
const LOGS_DIR = path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

/** Tamaño máximo por archivo de log antes de rotar (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;
/** Cantidad máxima de archivos rotados a conservar */
const MAX_FILES = 5;

/**
 * Formato estructurado (JSON) usado siempre en los archivos de log,
 * y en consola cuando NODE_ENV=production
 */
const structuredFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

/**
 * Formato legible por humanos para consola en desarrollo:
 * timestamp corto, nivel coloreado, mensaje/stack, y metadata extra en JSON compacto
 */
const developmentConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${stack || message}${metaStr}`;
  }),
);

/**
 * Logger estructurado de la aplicacion
 *
 * Reemplaza el console.error comentado en ErrorHandler.ts -- antes de esto,
 * ningun error de servidor se registraba en ningun lado (ni consola ni archivo).
 *
 * - NODE_ENV=test: silenciado por completo (mismo criterio que morgan, que ya
 *   se salta a si mismo en test) para no ensuciar la salida ni el disco durante
 *   la suite de tests.
 * - NODE_ENV=development: consola legible/coloreada + archivos JSON.
 * - NODE_ENV=production: consola JSON + archivos JSON (logs de produccion se
 *   asumen consumidos por un proceso/agregador, no leidos a ojo en una terminal).
 *
 * Uso: import { logger } from 'src/shared/logger/logger';
 *      logger.error('mensaje', { contexto: 'extra' });
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  silent: isTest,
  transports: [
    new winston.transports.Console({
      format: isProduction ? structuredFormat : developmentConsoleFormat,
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'error.log'),
      level: 'error',
      format: structuredFormat,
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
    }),
    new winston.transports.File({
      filename: path.join(LOGS_DIR, 'combined.log'),
      format: structuredFormat,
      maxsize: MAX_FILE_SIZE,
      maxFiles: MAX_FILES,
    }),
  ],
});
