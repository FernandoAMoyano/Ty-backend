import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../application/services/JwtService';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

/**
 * Interfaz extendida de Request que incluye información del usuario autenticado
 * Utilizada para tipar requests que han pasado por el middleware de autenticación
 */
export interface AuthenticatedRequest extends Request {
  /** Información del usuario autenticado extraída del token JWT */
  user?: {
    /** ID único del usuario en el sistema */
    userId: string;
    /** ID del rol asignado al usuario */
    roleId: string;
    /** Email del usuario para identificación */
    email: string;
  };
}

/**
 * Middleware de autenticación y autorización para proteger rutas
 * Valida tokens JWT y verifica permisos de usuario basados en roles
 */
export class AuthMiddleware {
  constructor(private jwtService: JwtService) {}

  /**
   * Middleware de autenticación que valida tokens JWT en las peticiones
   * @param req - Request de Express extendido con información de usuario
   * @param res - Response de Express
   * @param next - NextFunction para continuar con el siguiente middleware
   * @returns void
   * @description Extrae y valida el token JWT del header Authorization
   * @throws UnauthorizedError si no hay token o el token es inválido
   */
  authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Access token is required');
      }

      const token = authHeader.substring(7); // Remover 'Bearer '
      const payload = this.jwtService.verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        roleId: payload.roleId,
        email: payload.email,
      };

      next();
    } catch (error) {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };

  /**
   * Middleware de autorización que verifica permisos basados en roles
   * @param allowedRoles - Array de roles que tienen permiso para acceder al recurso
   * @returns Función middleware que valida si el usuario tiene el rol requerido
   * @description Verifica que el usuario autenticado tenga uno de los roles permitidos
   * @throws UnauthorizedError si el usuario no tiene permisos suficientes
   */
  authorize = (allowedRoles: string[]) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        // Obtener el rol del usuario desde la base de datos
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const userRole = await prisma.role.findUnique({
          where: { id: req.user.roleId }
        });
        
        await prisma.$disconnect();

        if (!userRole || !allowedRoles.includes(userRole.name)) {
          throw new UnauthorizedError('Insufficient permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
