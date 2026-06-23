-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "confirmationNotes" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "refundReason" TEXT;
