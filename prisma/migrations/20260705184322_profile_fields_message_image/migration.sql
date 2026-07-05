-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "coverUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "status" TEXT,
ADD COLUMN     "website" TEXT;
