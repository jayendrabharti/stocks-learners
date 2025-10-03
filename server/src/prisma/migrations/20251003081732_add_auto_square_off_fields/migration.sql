-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "actualExecutionTime" TIMESTAMP(3),
ADD COLUMN     "autoSquareOffTime" TIMESTAMP(3),
ADD COLUMN     "isAutoSquareOff" BOOLEAN NOT NULL DEFAULT false;
