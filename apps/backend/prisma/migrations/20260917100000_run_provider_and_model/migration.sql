-- Split the run's `model` column: it held the CLI (claude/gemini/codex).
-- `provider` now holds the CLI, `model` the model pinned on it (e.g. sonnet).
ALTER TABLE "run" ADD COLUMN "provider" TEXT;
UPDATE "run" SET "provider" = "model";
UPDATE "run" SET "model" = NULL;
