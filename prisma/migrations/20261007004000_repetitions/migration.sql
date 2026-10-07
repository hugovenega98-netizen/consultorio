-- Repetitions are intentionally separate from consultations so they do not
-- appear in the patient's consultation history or daily consultation export.
CREATE TABLE "Repetition" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "observations" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Repetition_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RepetitionMedication" (
    "id" TEXT NOT NULL,
    "repetitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "RepetitionMedication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Repetition_patientId_createdAt_idx" ON "Repetition"("patientId", "createdAt");
CREATE INDEX "Repetition_createdAt_idx" ON "Repetition"("createdAt");
CREATE UNIQUE INDEX "RepetitionMedication_repetitionId_position_key" ON "RepetitionMedication"("repetitionId", "position");
CREATE INDEX "RepetitionMedication_repetitionId_idx" ON "RepetitionMedication"("repetitionId");

ALTER TABLE "Repetition" ADD CONSTRAINT "Repetition_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RepetitionMedication" ADD CONSTRAINT "RepetitionMedication_repetitionId_fkey" FOREIGN KEY ("repetitionId") REFERENCES "Repetition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
