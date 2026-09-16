-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('planning', 'in_progress', 'on_hold', 'completed');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('uploading', 'processing', 'processed', 'needs_review', 'failed');

-- CreateEnum
CREATE TYPE "public"."DocumentType" AS ENUM ('pdf', 'docx', 'xlsx', 'csv', 'txt', 'image', 'other');

-- CreateEnum
CREATE TYPE "public"."Severity" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "public"."EventType" AS ENUM ('milestone_completed', 'work_completed', 'work_underway', 'schedule_delay', 'schedule_change', 'inspection', 'delivery', 'change_order', 'cost', 'invoice', 'decision', 'issue', 'risk', 'meeting', 'upcoming_work', 'other');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "address" TEXT,
    "startDate" TIMESTAMP(3),
    "targetEndDate" TIMESTAMP(3),
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "docType" "public"."DocumentType" NOT NULL DEFAULT 'other',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'uploading',
    "extractedText" TEXT,
    "processingError" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" "public"."EventType" NOT NULL DEFAULT 'other',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3),
    "severity" "public"."Severity" NOT NULL DEFAULT 'low',
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Risk" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "public"."Severity" NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" TIMESTAMP(3),
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "dueDate" TIMESTAMP(3),
    "assignee" TEXT,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinancialItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "itemDate" TIMESTAMP(3),
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChangeOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "itemDate" TIMESTAMP(3),
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChangeOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Person" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "organization" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trade" TEXT,
    "contact" TEXT,
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScheduleItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "plannedStart" TIMESTAMP(3),
    "plannedEnd" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "sourceDocumentId" TEXT NOT NULL,
    "sourceLocation" TEXT,
    "snippet" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Report" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "content" JSONB NOT NULL,
    "markdown" TEXT NOT NULL,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "public"."Project"("userId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "public"."Document"("projectId");

-- CreateIndex
CREATE INDEX "ProjectEvent_projectId_idx" ON "public"."ProjectEvent"("projectId");

-- CreateIndex
CREATE INDEX "ProjectEvent_sourceDocumentId_idx" ON "public"."ProjectEvent"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Risk_projectId_idx" ON "public"."Risk"("projectId");

-- CreateIndex
CREATE INDEX "Risk_sourceDocumentId_idx" ON "public"."Risk"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "public"."Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_sourceDocumentId_idx" ON "public"."Task"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "FinancialItem_projectId_idx" ON "public"."FinancialItem"("projectId");

-- CreateIndex
CREATE INDEX "FinancialItem_sourceDocumentId_idx" ON "public"."FinancialItem"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "ChangeOrder_projectId_idx" ON "public"."ChangeOrder"("projectId");

-- CreateIndex
CREATE INDEX "ChangeOrder_sourceDocumentId_idx" ON "public"."ChangeOrder"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Person_projectId_idx" ON "public"."Person"("projectId");

-- CreateIndex
CREATE INDEX "Person_sourceDocumentId_idx" ON "public"."Person"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Vendor_projectId_idx" ON "public"."Vendor"("projectId");

-- CreateIndex
CREATE INDEX "Vendor_sourceDocumentId_idx" ON "public"."Vendor"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "ScheduleItem_projectId_idx" ON "public"."ScheduleItem"("projectId");

-- CreateIndex
CREATE INDEX "ScheduleItem_sourceDocumentId_idx" ON "public"."ScheduleItem"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Report_projectId_idx" ON "public"."Report"("projectId");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectEvent" ADD CONSTRAINT "ProjectEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectEvent" ADD CONSTRAINT "ProjectEvent_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Risk" ADD CONSTRAINT "Risk_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Risk" ADD CONSTRAINT "Risk_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialItem" ADD CONSTRAINT "FinancialItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialItem" ADD CONSTRAINT "FinancialItem_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeOrder" ADD CONSTRAINT "ChangeOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChangeOrder" ADD CONSTRAINT "ChangeOrder_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Person" ADD CONSTRAINT "Person_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vendor" ADD CONSTRAINT "Vendor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vendor" ADD CONSTRAINT "Vendor_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleItem" ADD CONSTRAINT "ScheduleItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScheduleItem" ADD CONSTRAINT "ScheduleItem_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
