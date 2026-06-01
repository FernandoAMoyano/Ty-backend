import 'express';

/**
 * Extensión de tipos de Express para incluir datos del usuario autenticado
 * Utilizado por AuthMiddleware para poblar req.user tras validar el JWT
 */
declare module 'express-serve-static-core' {
  interface Request {
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
