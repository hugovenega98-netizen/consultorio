ALTER TABLE "Repetition" ADD COLUMN "clearedAt" TIMESTAMP(3),
ADD COLUMN "activeKey" TEXT;

-- Existing repetitions predate the batch/list workflow, so treat them as historical.
UPDATE "Repetition" SET "clearedAt" = CURRENT_TIMESTAMP WHERE "clearedAt" IS NULL;

CREATE INDEX "Repetition_clearedAt_createdAt_idx" ON "Repetition"("clearedAt", "createdAt");

CREATE UNIQUE INDEX "Repetition_activeKey_key" ON "Repetition"("activeKey");
