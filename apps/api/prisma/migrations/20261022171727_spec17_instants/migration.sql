-- CreateTable
CREATE TABLE "Instant" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "closeFriends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstantView" (
    "instantId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstantView_pkey" PRIMARY KEY ("instantId","userId")
);

-- CreateIndex
CREATE INDEX "Instant_userId_createdAt_idx" ON "Instant"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Instant_expiresAt_idx" ON "Instant"("expiresAt");

-- AddForeignKey
ALTER TABLE "Instant" ADD CONSTRAINT "Instant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantView" ADD CONSTRAINT "InstantView_instantId_fkey" FOREIGN KEY ("instantId") REFERENCES "Instant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstantView" ADD CONSTRAINT "InstantView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
