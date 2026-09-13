-- CreateTable
CREATE TABLE "workspace" (
    "workspace_id" TEXT NOT NULL PRIMARY KEY,
    "working_dir" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "session" (
    "session_id" TEXT NOT NULL PRIMARY KEY,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "workspace_workspace_id" TEXT NOT NULL,
    CONSTRAINT "session_workspace_workspace_id_fkey" FOREIGN KEY ("workspace_workspace_id") REFERENCES "workspace" ("workspace_id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "run" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "prompt" TEXT NOT NULL,
    "model" TEXT,
    "output_schema" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "result" TEXT,
    "exit_code" INTEGER,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "last_heartbeat" DATETIME,
    "session_session_id" TEXT NOT NULL,
    "workspace_workspace_id" TEXT NOT NULL,
    CONSTRAINT "run_session_session_id_fkey" FOREIGN KEY ("session_session_id") REFERENCES "session" ("session_id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "run_workspace_workspace_id_fkey" FOREIGN KEY ("workspace_workspace_id") REFERENCES "workspace" ("workspace_id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "run_event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "run_run_id" TEXT NOT NULL,
    CONSTRAINT "run_event_run_run_id_fkey" FOREIGN KEY ("run_run_id") REFERENCES "run" ("run_id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "prompt" (
    "prompt_id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prompt" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "session_workspace_workspace_id_index" ON "session"("workspace_workspace_id");

-- CreateIndex
CREATE INDEX "run_workspace_workspace_id_index" ON "run"("workspace_workspace_id");

-- CreateIndex
CREATE INDEX "run_session_session_id_index" ON "run"("session_session_id");

-- CreateIndex
CREATE INDEX "run_event_run_run_id_index" ON "run_event"("run_run_id");

