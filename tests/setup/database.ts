import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Solo limpiar usuarios de test
export const cleanupTestUsers = async () => {
  try {
    // Solo eliminar usuarios que contengan "test" en el email
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test',
        },
      },
    });
  } catch (error) {
    // Ignorar errores de limpieza
  }
};

export { prisma as testPrisma };
