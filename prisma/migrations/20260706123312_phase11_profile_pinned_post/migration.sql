-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pinnedPostId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pinnedPostId_fkey" FOREIGN KEY ("pinnedPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
