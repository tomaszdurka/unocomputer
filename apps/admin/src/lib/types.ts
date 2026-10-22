// The shapes the backend returns, mirroring apps/backend/src/database/dto/entities.dto.ts.
//
// Hand-written for now. The template generates its client from the backend's
// openapi.json (`pnpm --filter admin generate-api`); once that pipeline is wired up here
// these go away and the generated types take over - which is the point of keeping them
// in one file rather than scattered through the components.

export type RunStatus =
  'running' | 'success' | 'failure' | 'stopped' | 'interrupted';

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

/** What every list endpoint returns: one page, plus the size of the whole set. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

/** Matches the backend's default and cap; see apps/backend common/dto. */
export const PAGE_SIZE = 100;

/** A CLI UnoComputer can drive, with its live state. Mirrors GET /providers. */
export type Provider = {
  id: string;
  label: string;
  /** Looked up on the backend's PATH. */
  binary: string;
  /** Whether "<id>:<model>" pins the CLI's model. */
  pinnable: boolean;
  /** Suggested models, not a whitelist. */
  models: string[];
  available: boolean;
  path: string | null;
  enabled: boolean;
};

export type AppSettings = {
  /**
   * Models for runs that name none, in order of preference: the first whose
   * provider is enabled and installed is used. "<provider>" or "<provider>:<model>".
   */
  modelPreferences: string[];
  /** The preference a run would get right now; null when none is usable. */
  effectiveModel: string | null;
  /** Every preference that cannot be used, wherever it sits, and why. */
  unusable: { model: string; reason: string }[];
};

/** A provider's models as run names: itself, then its pinned variants. */
export function modelNames(p: Provider): string[] {
  return [p.id, ...(p.pinnable ? p.models.map((m) => `${p.id}:${m}`) : [])];
}

/**
 * What the run dialog suggests: every usable provider's models, in registry
 * order. A provider that is off or not installed is left out, so the picker
 * cannot offer a run the backend would refuse.
 */
export function modelChoices(providers: Provider[]): string[] {
  return providers.filter((p) => p.enabled && p.available).flatMap(modelNames);
}
