-- Revert the provider/model split: the run's `model` column again holds
-- "<provider>[:<model>]", e.g. "claude" or "claude:sonnet".
UPDATE "run" SET "model" = "provider" WHERE "model" IS NULL AND "provider" IS NOT NULL;
ALTER TABLE "run" DROP COLUMN "provider";
