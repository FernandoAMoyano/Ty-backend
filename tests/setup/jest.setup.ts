// Forzar NODE_ENV=test ANTES de cargar dotenv o cualquier modulo de la app.
// testEnvironmentOptions.NODE_ENV en jest.config.js NO tiene este efecto: esa opcion
// se pasa al constructor del entorno de test (el sandbox de jest-environment-node),
// nunca llega a process.env del proceso real que ejecuta los tests. Sin esta linea,
// NODE_ENV queda con el valor heredado del shell/contenedor (ej. 'development'), y
// todo lo que condiciona comportamiento en base a NODE_ENV === 'test' (morgan en
// app.ts, el logger de Winston) nunca se activa durante la suite de tests.
process.env.NODE_ENV = 'test';

import dotenv from 'dotenv';

// dotenv.config() no sobreescribe variables ya presentes en process.env por defecto,
// por lo que NODE_ENV se mantiene en 'test' aunque el .env real diga otra cosa.
dotenv.config();

console.log('✅ Jest setup completado');
