import { Injectable, Logger } from '@nestjs/common';
import type { CliEvent, JsonValue } from '../lib/json';
import type { Run } from './types';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'node:fs';
import { PrismaService } from '../prisma/prisma.service';
import { RunStatus } from './run-status';

// SQLite has no JSON type, so run.outputSchema, run.result and runEvent.payload are
// TEXT columns holding JSON. The API has always exposed them as objects - the admin
// feeds run.result straight into JSON.stringify - so they are (de)serialised here and
// nowhere else. Everything leaving this service is already hydrated.

function serialise(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return JSON.stringify(value);
}

function parse(value: string | null): JsonValue | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    // A row written outside this service, or truncated. Surface the raw text rather
    // than throwing and taking down the whole response.
    return value;
  }
}

type RawEvent = { payload: string };
type RawRun = {
  outputSchema?: string | null;
  result?: string | null;
  tags?: string | null;
  events?: RawEvent[];
};

function hydrateEvent<T extends RawEvent>(event: T) {
  return { ...event, payload: parse(event.payload) };
}

/** Tags are a JSON array of strings; anything else on the row reads as none. */
function parseTags(value: string | null): string[] {
  const parsed = parse(value);
  return Array.isArray(parsed)
    ? parsed.filter((tag): tag is string => typeof tag === 'string')
    : [];
}

function hydrateRun<T extends RawRun>(run: T): Run;
function hydrateRun<T extends RawRun>(run: T | null): Run | null;
function hydrateRun<T extends RawRun>(run: T | null): Run | null {
  if (!run) return null;
  return {
    ...run,
    outputSchema: parse(run.outputSchema ?? null),
    result: parse(run.result ?? null),
    tags: parseTags(run.tags ?? null),
    ...(run.events ? { events: run.events.map(hydrateEvent) } : {}),
  } as unknown as Run;
}

function hydrateRuns<T extends RawRun>(rows: T[] | undefined | null): Run[] {
  return rows ? rows.map((row) => hydrateRun(row)) : [];
}

@Injectable()
export class PersistenceService {
  private readonly logger = new Logger(PersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store an event for a run
   */
  async storeEvent(payload: {
    runId: string;
    event: CliEvent;
    sequence: number;
  }): Promise<void> {
    try {
      await this.prisma.runEvent.create({
        data: {
          id: `${payload.runId}-${payload.sequence}`,
          runId: payload.runId,
          type: payload.event?.type || 'unknown',
          payload: serialise(payload.event) ?? 'null',
          sequence: payload.sequence,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store event for run ${payload.runId}:`, error);
    }
  }

  /**
   * Set the status of a run
   */
  async setStatus(payload: {
    runId: string;
    status: RunStatus;
    result?: object;
    exitCode?: number;
  }): Promise<void> {
    try {
      await this.prisma.run.update({
        where: { runId: payload.runId },
        data: {
          status: payload.status,
          result: serialise(payload.result),
          exitCode: payload.exitCode ?? null,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to set status for run ${payload.runId}:`, error);
    }
  }

  /**
   * Create a session
   */
  async createSession(payload: { workspaceId: string }) {
    return this.prisma.session.create({
      data: { sessionId: uuidv4(), workspaceId: payload.workspaceId },
    });
  }

  /**
   * Get a session
   */
  async getSession(payload: { sessionId: string }) {
    return this.findSessionWithRuns(payload);
  }

  /**
   * Get all sessions
   */
  async findAllSessions() {
    const sessions = await this.prisma.session.findMany({
      orderBy: { createdAt: 'desc' },
      include: { workspace: true, runs: true },
    });
    return sessions.map((session) => ({ ...session, runs: hydrateRuns(session.runs) }));
  }

  /**
   * Get session with runs
   */
  async findSessionWithRuns(payload: { sessionId: string }) {
    const session = await this.prisma.session.findUnique({
      where: { sessionId: payload.sessionId },
      include: { workspace: true, runs: true },
    });
    return session ? { ...session, runs: hydrateRuns(session.runs) } : null;
  }

  /**
   * Retrieve a workspace
   */
  async getWorkspace(payload: { workspaceId: string }) {
    return this.prisma.workspace.findUnique({
      where: { workspaceId: payload.workspaceId },
    });
  }

  /**
   * Retrieve a run with events
   */
  async getRun(payload: { runId: string }) {
    return this.findRunWithEvents(payload);
  }

  /**
   * Create a workspace
   */
  async createWorkspace(payload: {
    workspaceId: string;
    workingDir: string;
    name?: string;
  }) {
    fs.mkdirSync(payload.workingDir, { recursive: true });
    return this.prisma.workspace.create({
      data: {
        workspaceId: payload.workspaceId,
        workingDir: payload.workingDir,
        name: payload.name ?? null,
      },
    });
  }

  /**
   * Create a run
   */
  async createRun(payload: {
    prompt: string;
    sessionId: string;
    workspaceId: string;
    outputSchema?: object;
    model?: string;
    tags?: string[];
  }) {
    const run = await this.prisma.run.create({
      data: {
        runId: uuidv4(),
        prompt: payload.prompt,
        sessionId: payload.sessionId,
        workspaceId: payload.workspaceId,
        outputSchema: serialise(payload.outputSchema),
        model: payload.model ?? null,
        tags: JSON.stringify(payload.tags ?? []),
        status: RunStatus.RUNNING,
      },
    });
    return hydrateRun(run);
  }

  /**
   * Get all workspaces
   */
  async findAllWorkspaces() {
    return this.prisma.workspace.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Get workspace with runs
   */
  async findWorkspace(payload: { workspaceId: string }) {
    return this.getWorkspace(payload);
  }

  /**
   * Get workspace with runs
   */
  async findWorkspaceWithRuns(payload: { id: string }) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { workspaceId: payload.id },
      include: { runs: { include: { session: true } } },
    });
    return workspace ? { ...workspace, runs: hydrateRuns(workspace.runs) } : null;
  }

  /**
   * Get all runs, optionally narrowed to the caller's own.
   *
   * `tags` is an AND: a run must carry every tag asked for. Tags live in a TEXT
   * column, so the filter is a substring match on the serialised array - safe
   * because tags are validated as lowercase slugs, which cannot contain the
   * quotes that delimit them.
   */
  async findAllRuns(filter?: { tags?: string[]; status?: string }) {
    const where: Prisma.RunWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.tags?.length) {
      where.AND = filter.tags.map((tag) => ({
        tags: { contains: `"${tag}"` },
      }));
    }
    const runs = await this.prisma.run.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: { workspace: true },
    });
    return hydrateRuns(runs);
  }

  /**
   * Get run with events
   */
  async findRunWithEvents(payload: { runId: string }) {
    const run = await this.prisma.run.findUnique({
      where: { runId: payload.runId },
      include: {
        events: { orderBy: { sequence: 'asc' } },
        workspace: true,
        session: true,
      },
    });
    return hydrateRun(run);
  }

  /**
   * Update a workspace
   */
  async updateWorkspace(payload: { workspaceId: string; name?: string | null }) {
    const data: Prisma.WorkspaceUpdateInput = {};
    if (payload.name !== undefined) data.name = payload.name;

    try {
      return await this.prisma.workspace.update({
        where: { workspaceId: payload.workspaceId },
        data,
      });
    } catch {
      return null;
    }
  }

  /**
   * Stop all running runs (called on service startup/shutdown)
   */
  async stopAllRunningRuns(): Promise<number> {
    try {
      const { count } = await this.prisma.run.updateMany({
        where: { status: RunStatus.RUNNING },
        data: { status: RunStatus.STOPPED, completedAt: new Date() },
      });
      if (count > 0) this.logger.log(`Stopped ${count} running run(s)`);
      return count;
    } catch (error) {
      this.logger.error('Failed to stop running runs:', error);
      return 0;
    }
  }

  /**
   * Create a prompt
   */
  async createPrompt(payload: {
    name: string;
    description?: string;
    prompt: string;
  }) {
    return this.prisma.prompt.create({
      data: {
        promptId: uuidv4(),
        name: payload.name,
        description: payload.description ?? null,
        prompt: payload.prompt,
      },
    });
  }

  /**
   * Get all prompts
   */
  async findAllPrompts() {
    return this.prisma.prompt.findMany({ orderBy: { createdAt: 'desc' } });
  }

  /**
   * Get a prompt by ID
   */
  async getPrompt(payload: { promptId: string }) {
    return this.prisma.prompt.findUnique({ where: { promptId: payload.promptId } });
  }

  /**
   * Update a prompt
   */
  async updatePrompt(payload: {
    promptId: string;
    name?: string;
    description?: string | null;
    prompt?: string;
  }) {
    const data: Prisma.PromptUpdateInput = {};
    if (payload.name !== undefined) data.name = payload.name;
    if (payload.description !== undefined) data.description = payload.description;
    if (payload.prompt !== undefined) data.prompt = payload.prompt;

    try {
      return await this.prisma.prompt.update({
        where: { promptId: payload.promptId },
        data,
      });
    } catch {
      return null;
    }
  }

  /**
   * Delete a prompt
   */
  async deletePrompt(payload: { promptId: string }): Promise<boolean> {
    try {
      await this.prisma.prompt.delete({ where: { promptId: payload.promptId } });
      return true;
    } catch {
      return false;
    }
  }
}
