-- Clinical fields for consultation workflow.
-- All columns are nullable/defaulted so existing consultations remain valid.
ALTER TABLE "Consultation"
  ADD COLUMN "motivoConsulta" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "antecedentesPersonales" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "actividadFisica" INTEGER,
  ADD COLUMN "catarsis" INTEGER,
  ADD COLUMN "diuresis" INTEGER,
  ADD COLUMN "ansiedad" INTEGER,
  ADD COLUMN "tensionArterial" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "peso" DOUBLE PRECISION;
