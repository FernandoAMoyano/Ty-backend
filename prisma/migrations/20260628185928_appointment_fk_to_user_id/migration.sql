-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_stylistId_fkey";

-- Data migration: Convert clientId from Client.id to User.id
UPDATE "Appointment"
SET "clientId" = "Client"."userId"
FROM "Client"
WHERE "Appointment"."clientId" = "Client"."id";

-- Data migration: Convert stylistId from Stylist.id to User.id
UPDATE "Appointment"
SET "stylistId" = "Stylist"."userId"
FROM "Stylist"
WHERE "Appointment"."stylistId" = "Stylist"."id";

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_stylistId_fkey" FOREIGN KEY ("stylistId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
