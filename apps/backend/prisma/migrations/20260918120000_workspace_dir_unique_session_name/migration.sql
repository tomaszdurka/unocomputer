-- A workspace can now be bound to any existing folder the caller names. Two
-- workspaces on one folder would share files and CLI session state silently, so
-- one folder = one workspace. Every existing row has its own UUID directory, so
-- the index applies cleanly.
CREATE UNIQUE INDEX "workspace_working_dir_key" ON "workspace"("working_dir");

-- Optional human label for a session; runs keep addressing sessions by id.
ALTER TABLE "session" ADD COLUMN "name" TEXT;
