// tests/debug/structure-debug.test.ts
// EJECUTA ESTE TEST UNA VEZ PARA VER LA ESTRUCTURA REAL

import request from 'supertest';
import app from '../../src/app';

import { RoleName } from '@prisma/client';
import { testPrisma } from '../setup/database';

describe('Debug Structure Test', () => {
  it('should show actual register response structure', async () => {
    // Obtener rol CLIENT real
    const clientRole = await testPrisma.role.findFirst({
      where: { name: RoleName.CLIENT },
    });

    expect(clientRole).toBeTruthy();
    console.log('CLIENT Role found:', clientRole);

    // Hacer registro
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Debug User',
        email: `debug-${Date.now()}@example.com`,
        phone: '+1234567890',
        password: 'TestPass123!',
        roleId: clientRole!.id,
      });

    console.log('=== REGISTRO RESPONSE STATUS ===');
    console.log(response.status);

    console.log('=== REGISTRO RESPONSE BODY COMPLETO ===');
    console.log(JSON.stringify(response.body, null, 2));

    console.log('=== ESTRUCTURA response.body.data ===');
    console.log(JSON.stringify(response.body.data, null, 2));

    // Si existe user dentro de data
    if (response.body.data && response.body.data.user) {
      console.log('=== ESTRUCTURA response.body.data.user ===');
      console.log(JSON.stringify(response.body.data.user, null, 2));
    }

    // El test debe pasar si llega aquí
    expect(response.status).toBe(201);
  });
});
