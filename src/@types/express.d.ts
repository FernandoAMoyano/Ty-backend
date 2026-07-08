import 'express';

/**
 * Extensión de tipos de Express para incluir datos del usuario autenticado
 * y el ID de correlación de la request
 * Utilizado por AuthMiddleware (req.user) y RequestIdMiddleware (req.id)
 */
declare module 'express-serve-static-core' {
  interface Request {
    /** ID unico de correlacion de la request, generado por RequestIdMiddleware */
    id: string;
    user?: {
      /** ID único del usuario autenticado */
      userId: string;
      /** ID del rol asignado al usuario */
      roleId: string;
      /** Email del usuario autenticado */
      email: string;
    };
  }
}
