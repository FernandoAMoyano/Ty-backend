import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que genera un ID unico de correlacion por request (req.id)
 *
 * Complementa directamente al logger estructurado (Winston, ver src/shared/logger):
 * sin esto, dos requests concurrentes con error se mezclan en el log sin forma
 * de distinguir cual genero cada linea.
 *
 * Se expone tambien como header de respuesta X-Request-Id, para que quien
 * consume la API pueda correlacionar un error reportado por un cliente con
 * las lineas de log del servidor.
 *
 * Debe registrarse como el primer middleware de la app (antes de helmet, cors,
 * body parsers, etc.) para que req.id este disponible en todo el pipeline,
 * incluyendo el errorHandler final.
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};
