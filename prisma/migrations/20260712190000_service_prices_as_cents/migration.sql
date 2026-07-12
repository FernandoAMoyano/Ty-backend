/*
  Warnings:

  - You are about to alter the column `price` on the `Service` table, which contains 4 non-null values. The data in that column will be cast from `Decimal(10,2)` to `Integer`.
  - You are about to alter the column `customPrice` on the `StylistService` table, which contains 1 non-null values. The data in that column will be cast from `Decimal(10,2)` to `Integer`.

  Note (F2): `price`/`customPrice` pasan a representar centavos (patron Stripe) en vez de
  unidades de moneda con 2 decimales. El cast de esta migracion solo redondea el valor
  decimal existente a entero (no lo multiplica por 100) -- los datos reales quedan
  consistentes despues de resembrar (`prisma/seed.ts` ya siembra en centavos).
*/

-- AlterTable
ALTER TABLE "Service" ALTER COLUMN "price" SET DATA TYPE INTEGER USING ROUND("price")::INTEGER;

-- AlterTable
ALTER TABLE "StylistService" ALTER COLUMN "customPrice" SET DATA TYPE INTEGER USING ROUND("customPrice")::INTEGER;
