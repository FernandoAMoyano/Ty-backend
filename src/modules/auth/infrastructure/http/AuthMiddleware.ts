import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../application/services/JwtService';
import { UnauthorizedError } from '../../../../shared/exceptions/UnauthorizedError';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roleId: string;
        email: string;
      };
    }
  }
}

export class AuthMiddleware {
  constructor(private jwtService: JwtService) {}

  authenticate = (req: Request, res: Response, next: NextFunction): void => {
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
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        if (!allowedRoles.includes(req.user.roleId)) {
          throw new UnauthorizedError('Insufficient permissions');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
