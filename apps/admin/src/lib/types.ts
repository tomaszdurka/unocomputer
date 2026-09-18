// The shapes the backend returns, mirroring apps/backend/src/database/dto/entities.dto.ts.
//
// Hand-written for now. The template generates its client from the backend's
// openapi.json (`pnpm --filter admin generate-api`); once that pipeline is wired up here
// these go away and the generated types take over - which is the point of keeping them
// in one file rather than scattered through the components.

export type RunStatus = 'running' | 'success' | 'failure' | 'stopped';

export type Workspace = {
  workspaceId: string;
  workingDir: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  runs?: Run[];
  sessions?: Session[];
};

export type Session = {
  sessionId: string;
  /** Optional label. Runs still address a session by id. */
  name: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceId: string;
  workspace?: Workspace;
  runs?: Run[];
};

export type RunEvent = {
  id: string;
  type: string;
  payload: unknown;
  sequence: number;
  createdAt: string;
  runId: string;
};

export type Run = {
  runId: string;
  prompt: string;
  model: string | null;
  /** Caller-supplied labels, e.g. ["job-hunt","matching"]. */
  tags?: string[];
  outputSchema?: unknown;
  status: RunStatus;
  result?: unknown;
  exitCode: number | null;
  startedAt: string;
  completedAt: string | null;
  lastHeartbeat: string | null;
  sessionId: string;
  workspaceId: string;
  session?: Session;
  workspace?: Workspace;
  events?: RunEvent[];
};

export type Prompt = {
  promptId: string;
  name: string;
  description: string | null;
  prompt: string;
  createdAt: string;
  updatedAt: string;
};

/** A session as the workspace detail view shows it, with its runs folded in. */
export type WorkspaceSessionSummary = {
  sessionId: string;
  name: string | null;
  /** `idle` for a session created ahead of its first run. */
  status: RunStatus | 'idle';
  runCount: number;
  lastUsed: string;
};
