-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'REVIEWER', 'USER');

-- CreateEnum
CREATE TYPE "QueryStatus" AS ENUM ('PENDING_AI', 'PENDING_REVIEW', 'APPROVED', 'EDITED', 'REJECTED', 'ANSWERED');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVED', 'EDITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoEmoji" TEXT NOT NULL DEFAULT '🏢',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Query" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "QueryStatus" NOT NULL DEFAULT 'PENDING_AI',
    "aiDraft" TEXT,
    "finalAnswer" TEXT,
    "sources" JSONB,
    "agentLog" JSONB,
    "imageUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Query_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "editedContent" TEXT,
    "note" TEXT,
    "reviewerId" TEXT NOT NULL,
    "queryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "content" TEXT NOT NULL,
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "serviceId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embeddingJson" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "documentId" TEXT NOT NULL,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'FREE',
    "lsSubscriptionId" TEXT,
    "lsCustomerId" TEXT,
    "lsOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "algoTxId" TEXT,
    "walletAddress" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "queryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "queryId" TEXT,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Service_serviceCode_key" ON "Service"("serviceCode");

-- CreateIndex
CREATE INDEX "Service_ownerId_idx" ON "Service"("ownerId");

-- CreateIndex
CREATE INDEX "ServiceMember_userId_idx" ON "ServiceMember"("userId");

-- CreateIndex
CREATE INDEX "ServiceMember_serviceId_idx" ON "ServiceMember"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceMember_userId_serviceId_key" ON "ServiceMember"("userId", "serviceId");

-- CreateIndex
CREATE INDEX "Query_serviceId_status_idx" ON "Query"("serviceId", "status");

-- CreateIndex
CREATE INDEX "Query_submitterId_idx" ON "Query"("submitterId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_queryId_key" ON "Review"("queryId");

-- CreateIndex
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_serviceId_idx" ON "KnowledgeDocument"("serviceId");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_lsSubscriptionId_key" ON "UserSubscription"("lsSubscriptionId");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_serviceId_key" ON "Subscription"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_algoTxId_key" ON "Subscription"("algoTxId");

-- CreateIndex
CREATE INDEX "Message_userId_serviceId_createdAt_idx" ON "Message"("userId", "serviceId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Message_queryId_idx" ON "Message"("queryId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "ServiceMember" ADD CONSTRAINT "ServiceMember_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Query" ADD CONSTRAINT "Query_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "ServiceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Query" ADD CONSTRAINT "Query_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "ServiceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_queryId_fkey" FOREIGN KEY ("queryId") REFERENCES "Query"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "ServiceMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
