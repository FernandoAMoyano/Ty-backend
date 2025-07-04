import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../application/services/JwtService';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    roleId: string;
    email: string;
  };
}

export class AuthMiddleware {
  constructor(private jwtService: JwtService) {}

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

  authorize = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        const roleMapping: Record<string, string> = {
          '4b39b668-2515-4f5c-b032-e71e9c5f401c': 'ADMIN',
        };

        const roleName = roleMapping[req.user.roleId];

        if (!roleName || !allowedRoles.includes(roleName)) {
          throw new UnauthorizedError('Insufficient permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
