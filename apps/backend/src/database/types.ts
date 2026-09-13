// Domain types for the rest of the app.
//
// Prisma's generated models type outputSchema / result / payload as `string`, because
// that is what the SQLite columns hold. PersistenceService parses them on the way out,
// so what actually flows through the app is the parsed object - these aliases say so
// rather than letting callers believe they have a string.
import type { JsonValue } from '../lib/json';
import type {
  Run as PrismaRun,
  RunEvent as PrismaRunEvent,
  Session as PrismaSession,
  Workspace as PrismaWorkspace,
  Prompt as PrismaPrompt,
} from '@prisma/client';

export type Session = PrismaSession & {
  // Populated when the query includes them.
  workspace?: Workspace;
  runs?: Run[];
};
export type Workspace = PrismaWorkspace & {
  runs?: Run[];
  sessions?: Session[];
};
export type Prompt = PrismaPrompt;

export type RunEvent = Omit<PrismaRunEvent, 'payload'> & {
  payload: JsonValue;
};

export type Run = Omit<PrismaRun, 'outputSchema' | 'result'> & {
  outputSchema?: JsonValue;
  result?: JsonValue;
  events?: RunEvent[];
  session?: Session;
  workspace?: Workspace;
};

export { RunStatus, RUN_STATUSES } from './run-status';
