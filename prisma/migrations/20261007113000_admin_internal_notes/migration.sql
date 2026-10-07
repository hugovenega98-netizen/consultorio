-- Add ADMIN role without replacing the enum, preserving existing users.
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';

-- Administrative notes are intentionally separate from consultation observations
-- and are never exposed on the doctor's consultation screen.
ALTER TABLE "Patient" ADD COLUMN "internalNotes" TEXT NOT NULL DEFAULT '';
