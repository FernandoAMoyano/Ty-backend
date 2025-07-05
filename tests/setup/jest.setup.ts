import dotenv from 'dotenv';
dotenv.config();

// Configuración de base de datos para tests
console.log('Configurando entorno de tests...');

// Forzar el uso de la base de datos de test
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  console.log('Usando base de datos de TESTS:', process.env.DATABASE_URL);
} else {
  console.log('TEST_DATABASE_URL no encontrada, usando DATABASE_URL principal');
}

console.log('Configuración de tests completada');
