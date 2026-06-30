/*
  Warnings:

  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Stylist` table. If the table is not empty, all the data it contains will be lost.

  Data migrations:
  - Client.preferences -> User.preferences (matched by Client.userId = User.id)
  - StylistService.stylistId: Stylist.id -> Stylist.userId (User.id)
*/

-- 1. Drop all FK constraints FIRST
ALTER TABLE "Client" DROP CONSTRAINT "Client_userId_fkey";
ALTER TABLE "Stylist" DROP CONSTRAINT "Stylist_userId_fkey";
ALTER TABLE "StylistService" DROP CONSTRAINT "StylistService_stylistId_fkey";

-- 2. Add preferences column to User
ALTER TABLE "User" ADD COLUMN "preferences" TEXT;

-- 3. Migrate preferences data from Client to User
UPDATE "User" SET "preferences" = "Client"."preferences"
FROM "Client" WHERE "User"."id" = "Client"."userId";

-- 4. Update StylistService.stylistId from Stylist.id to Stylist.userId (User.id)
UPDATE "StylistService" SET "stylistId" = "Stylist"."userId"
FROM "Stylist" WHERE "StylistService"."stylistId" = "Stylist"."id";

-- 5. Add new FK constraint: StylistService.stylistId -> User.id
ALTER TABLE "StylistService" ADD CONSTRAINT "StylistService_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 6. Drop tables (data already migrated)
DROP TABLE "Client";
DROP TABLE "Stylist";
