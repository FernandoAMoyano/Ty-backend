import * as jwt from 'jsonwebtoken';
import { JwtService, JwtPayload } from '../../application/services/JwtService';

export class JwtTokenService implements JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    // En producción, estos valores vendrán del .env
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-token-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret';
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'turnity-api',
      audience: 'turnity-app',
    } as jwt.SignOptions);
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'turnity-api',
      audience: 'turnity-app',
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret, {
        issuer: 'turnity-api',
        audience: 'turnity-app',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'turnity-api',
        audience: 'turnity-app',
      }) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}
