-- CreateEnum
CREATE TYPE "UserRelationType" AS ENUM ('BLOCK', 'MUTE_POSTS', 'MUTE_STORIES', 'RESTRICT', 'CLOSE_FRIEND');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'FOLLOW_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_LIKE';
ALTER TYPE "NotificationType" ADD VALUE 'MENTION';
ALTER TYPE "NotificationType" ADD VALUE 'TAG';

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" VARCHAR(50);

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "replyToId" INTEGER,
ADD COLUMN     "storyId" INTEGER;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "commentsDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hideLikeCount" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" VARCHAR(100),
ADD COLUMN     "pinnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN     "isRestricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "closeFriends" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FollowRequest" (
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowRequest_pkey" PRIMARY KEY ("requesterId","targetId")
);

-- CreateTable
CREATE TABLE "UserRelation" (
    "ownerId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "type" "UserRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRelation_pkey" PRIMARY KEY ("ownerId","targetId","type")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostTag" (
    "postId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "imageIndex" INTEGER NOT NULL DEFAULT 0,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PostTag_pkey" PRIMARY KEY ("postId","userId")
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "collectionId" INTEGER NOT NULL,
    "postId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","postId")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "userId" TEXT NOT NULL,
    "commentId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("userId","commentId")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HighlightStory" (
    "highlightId" INTEGER NOT NULL,
    "storyId" INTEGER NOT NULL,

    CONSTRAINT "HighlightStory_pkey" PRIMARY KEY ("highlightId","storyId")
);

-- CreateTable
CREATE TABLE "ChatMember" (
    "chatId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMember_pkey" PRIMARY KEY ("chatId","userId")
);

-- CreateTable
CREATE TABLE "MessageLike" (
    "messageId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageLike_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateIndex
CREATE INDEX "FollowRequest_targetId_createdAt_idx" ON "FollowRequest"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "UserRelation_targetId_type_idx" ON "UserRelation"("targetId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_targetType_targetId_key" ON "Report"("userId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "PostTag_userId_idx" ON "PostTag"("userId");

-- CreateIndex
CREATE INDEX "Collection_userId_idx" ON "Collection"("userId");

-- CreateIndex
CREATE INDEX "CommentLike_commentId_idx" ON "CommentLike"("commentId");

-- CreateIndex
CREATE INDEX "Highlight_userId_idx" ON "Highlight"("userId");

-- CreateIndex
CREATE INDEX "ChatMember_userId_idx" ON "ChatMember"("userId");

-- CreateIndex
CREATE INDEX "Post_location_idx" ON "Post"("location");

-- AddForeignKey
ALTER TABLE "FollowRequest" ADD CONSTRAINT "FollowRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowRequest" ADD CONSTRAINT "FollowRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelation" ADD CONSTRAINT "UserRelation_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostTag" ADD CONSTRAINT "PostTag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "PostComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightStory" ADD CONSTRAINT "HighlightStory_highlightId_fkey" FOREIGN KEY ("highlightId") REFERENCES "Highlight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HighlightStory" ADD CONSTRAINT "HighlightStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMember" ADD CONSTRAINT "ChatMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLike" ADD CONSTRAINT "MessageLike_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageLike" ADD CONSTRAINT "MessageLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
