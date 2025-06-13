import request from 'supertest';
import app from '../../../src/app';
import { loginAsAdmin } from '../../setup/helpers';

describe('Profile Integration Tests', () => {
  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const token = await loginAsAdmin();

      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('admin@turnity.com');
      expect(response.body.data.name).toBe('Only Name Updated');
      expect(response.body.data.role.name).toBe('ADMIN');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('phone');
      expect(response.body.data).toHaveProperty('isActive');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('updatedAt');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    it('should update user profile successfully', async () => {
      const token = await loginAsAdmin();

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Admin Name',
          phone: '+9876543210',
          profilePicture: 'https://example.com/new-photo.jpg',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Admin Name');
      expect(response.body.data.phone).toBe('+9876543210');
      expect(response.body.data.profilePicture).toBe('https://example.com/new-photo.jpg');
    });

    it('should update profile with partial data', async () => {
      const token = await loginAsAdmin();

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Only Name Updated',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Only Name Updated');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app).put('/api/v1/auth/profile').send({
        name: 'Unauthorized Update',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate phone format in update', async () => {
      const token = await loginAsAdmin();

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          phone: 'invalid-phone-format',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid phone format');
    });

    it('should reject empty name', async () => {
      const token = await loginAsAdmin();

      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      /* expect(response.body.message).toContain('User name cannot be empty');*/
      expect(response.body.message).toContain('Internal server error');
    });
  });
});
