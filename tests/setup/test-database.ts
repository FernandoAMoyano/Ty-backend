import { PrismaClient, RoleName } from '@prisma/client';
import { generateUuid } from '../../src/shared/utils/uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export const setupTestDatabase = async () => {
  // Limpiar datos existentes
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Crear roles de test
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        id: generateUuid(),
        name: RoleName.ADMIN,
        description: 'Admin for testing',
      },
    }),
    prisma.role.create({
      data: {
        id: generateUuid(),
        name: RoleName.CLIENT,
        description: 'Client for testing',
      },
    }),
    prisma.role.create({
      data: {
        id: generateUuid(),
        name: RoleName.STYLIST,
        description: 'Stylist for testing',
      },
    }),
  ]);

  // Crear usuario admin de test
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.create({
    data: {
      id: generateUuid(),
      roleId: roles[0].id,
      name: 'Test Admin',
      email: 'admin@turnity.com',
      phone: '+1234567890',
      password: hashedPassword,
      isActive: true,
    },
  });

  return {
    roles,
    adminUser,
    adminRole: roles[0],
    clientRole: roles[1],
    stylistRole: roles[2],
  };
};

export const cleanupTestDatabase = async () => {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test',
      },
    },
  });
};

export const teardownTestDatabase = async () => {
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.$disconnect();
};

export { prisma as testPrisma };
