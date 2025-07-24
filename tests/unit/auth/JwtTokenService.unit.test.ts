import { JwtPayload } from '../../../src/modules/auth/application/services/JwtService';
import { JwtTokenService } from '../../../src/modules/auth/infrastructure/services/JwtTokenService';

describe('JwtTokenService Unit Tests', () => {
  let jwtService: JwtTokenService;
  let mockPayload: JwtPayload;

  beforeEach(() => {
    // Establecer variables de entorno de prueba
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRY = '15m';
    process.env.JWT_REFRESH_EXPIRY = '7d';

    jwtService = new JwtTokenService();
    mockPayload = {
      userId: 'user-123',
      roleId: 'role-456',
      email: 'test@example.com',
    };
  });

  describe('generateAccessToken', () => {
    // Debería generar un token de acceso válido
    it('should generate a valid access token', () => {
      const token = jwtService.generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT structure
    });

    // Debería generar diferentes tokens para diferentes payloads
    it('should generate different tokens for different payloads', () => {
      const payload1 = { ...mockPayload, userId: 'user-1' };
      const payload2 = { ...mockPayload, userId: 'user-2' };

      const token1 = jwtService.generateAccessToken(payload1);
      const token2 = jwtService.generateAccessToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    // Debería generar un token de refresco válido
    it('should generate a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    // Debería generar un token de refresco diferente al token de acceso
    it('should generate different refresh token than access token', () => {
      const accessToken = jwtService.generateAccessToken(mockPayload);
      const refreshToken = jwtService.generateRefreshToken(mockPayload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    // Debería verificar token de acceso válido
    it('should verify valid access token', () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.roleId).toBe(mockPayload.roleId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    // Debería lanzar error para token inválido
    it('should throw error for invalid token', () => {
      expect(() => {
        jwtService.verifyAccessToken('invalid.token.here');
      }).toThrow('Invalid access token');
    });

    // Debería lanzar error para token mal formado
    it('should throw error for malformed token', () => {
      expect(() => {
        jwtService.verifyAccessToken('malformed-token');
      }).toThrow('Invalid access token');
    });
  });

  describe('verifyRefreshToken', () => {
    // Debería verificar token de refresco válido
    it('should verify valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockPayload);
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.roleId).toBe(mockPayload.roleId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    // Debería lanzar error para token de refresco inválido
    it('should throw error for invalid refresh token', () => {
      expect(() => {
        jwtService.verifyRefreshToken('invalid.refresh.token');
      }).toThrow('Invalid refresh token');
    });

    // No debería verificar token de acceso como token de refresco
    it('should not verify access token as refresh token', () => {
      const accessToken = jwtService.generateAccessToken(mockPayload);

      expect(() => {
        jwtService.verifyRefreshToken(accessToken);
      }).toThrow('Invalid refresh token');
    });
  });
});
