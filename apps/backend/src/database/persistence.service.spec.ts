import { PersistenceService } from './persistence.service';
import { RunStatus } from './run-status';
import type { PrismaService } from '../prisma/prisma.service';

// The JSON boundary is the part of the Prisma migration that could silently regress.
// SQLite has no JSON type, so run.outputSchema, run.result and runEvent.payload are TEXT
// columns holding JSON; PersistenceService serialises on the way in and parses on the way
// out so the API keeps exposing objects. If that ever slips, the admin starts rendering
// `"{\"result\":...}"` instead of a formatted object and nothing throws.

type Recorded = { model: string; op: string; args: any };

function fakePrisma() {
  const calls: Recorded[] = [];
  const record = (model: string, op: string, result: unknown) => (args: any) => {
    calls.push({ model, op, args });
    return Promise.resolve(typeof result === 'function' ? (result as any)(args) : result);
  };
  const prisma = {
    calls,
    returns: {} as Record<string, unknown>,
    run: {
      create: record('run', 'create', () => prisma.returns.run),
      update: record('run', 'update', () => prisma.returns.run),
      updateMany: record('run', 'updateMany', { count: 2 }),
      findUnique: record('run', 'findUnique', () => prisma.returns.run),
      findMany: record('run', 'findMany', () => prisma.returns.runs ?? []),
    },
    runEvent: { create: record('runEvent', 'create', {}) },
    workspace: {
      findUnique: record('workspace', 'findUnique', () => prisma.returns.workspace),
      findMany: record('workspace', 'findMany', []),
      create: record('workspace', 'create', {}),
      update: record('workspace', 'update', {}),
    },
    session: {
      create: record('session', 'create', {}),
      findUnique: record('session', 'findUnique', () => prisma.returns.session),
      findMany: record('session', 'findMany', () => prisma.returns.sessions ?? []),
    },
    prompt: {
      create: record('prompt', 'create', {}),
      findMany: record('prompt', 'findMany', []),
      findUnique: record('prompt', 'findUnique', null),
      update: record('prompt', 'update', {}),
      delete: record('prompt', 'delete', {}),
    },
  };
  return prisma;
}

const rawRun = (over: Record<string, unknown> = {}) => ({
  runId: 'r1',
  prompt: 'hi',
  model: 'claude',
  outputSchema: null,
  status: 'success',
  result: null,
  exitCode: 0,
  startedAt: new Date('2026-01-01T00:00:00Z'),
  completedAt: null,
  lastHeartbeat: null,
  sessionId: 's1',
  workspaceId: 'w1',
  ...over,
});

describe('PersistenceService JSON boundary', () => {
  let prisma: ReturnType<typeof fakePrisma>;
  let service: PersistenceService;

  beforeEach(() => {
    prisma = fakePrisma();
    service = new PersistenceService(prisma as unknown as PrismaService);
  });

  it('stores an event payload as a JSON string', async () => {
    await service.storeEvent({ runId: 'r1', sequence: 3, event: { type: 'text', body: 'x' } });

    const call = prisma.calls.find((c) => c.model === 'runEvent');
    expect(typeof call!.args.data.payload).toBe('string');
    expect(JSON.parse(call!.args.data.payload)).toEqual({ type: 'text', body: 'x' });
    expect(call!.args.data.type).toBe('text');
    // the id is derived from run + sequence, which is what keeps events ordered and unique
    expect(call!.args.data.id).toBe('r1-3');
  });

  it('falls back to "unknown" when an event carries no type', async () => {
    await service.storeEvent({ runId: 'r1', sequence: 1, event: { body: 'x' } });
    const call = prisma.calls.find((c) => c.model === 'runEvent');
    expect(call!.args.data.type).toBe('unknown');
  });

  it('serialises a run result on the way in', async () => {
    await service.setStatus({ runId: 'r1', status: RunStatus.SUCCESS, result: { ok: true }, exitCode: 0 });

    const call = prisma.calls.find((c) => c.op === 'update');
    expect(call!.args.data.result).toBe('{"ok":true}');
    expect(call!.args.data.completedAt).toBeInstanceOf(Date);
  });

  it('writes null rather than the string "undefined" when there is no result', async () => {
    await service.setStatus({ runId: 'r1', status: RunStatus.FAILURE });
    const call = prisma.calls.find((c) => c.op === 'update');
    expect(call!.args.data.result).toBeNull();
    expect(call!.args.data.exitCode).toBeNull();
  });

  it('parses result, outputSchema and event payloads back into objects', async () => {
    prisma.returns.run = rawRun({
      result: '{"answer":42}',
      outputSchema: '{"type":"object"}',
      events: [{ id: 'r1-1', type: 'text', payload: '{"a":1}', sequence: 1 }],
    });

    const run = await service.findRunWithEvents({ runId: 'r1' });

    expect(run!.result).toEqual({ answer: 42 });
    expect(run!.outputSchema).toEqual({ type: 'object' });
    expect(run!.events![0].payload).toEqual({ a: 1 });
  });

  it('surfaces malformed JSON as raw text instead of throwing', async () => {
    // A truncated write should not take down the whole response.
    prisma.returns.run = rawRun({ result: '{"answer":4' });

    const run = await service.findRunWithEvents({ runId: 'r1' });

    expect(run!.result).toBe('{"answer":4');
  });

  it('stores tags as a JSON array and hydrates them back to strings', async () => {
    await service.createRun({
      prompt: 'p',
      sessionId: 's1',
      workspaceId: 'w1',
      tags: ['job-hunt', 'matching'],
    });
    const call = prisma.calls.find((c) => c.op === 'create' && c.model === 'run');
    expect(call!.args.data.tags).toBe('["job-hunt","matching"]');

    prisma.returns.run = rawRun({ tags: '["job-hunt","matching"]' });
    const run = await service.findRunWithEvents({ runId: 'r1' });
    expect(run!.tags).toEqual(['job-hunt', 'matching']);
  });

  it('defaults tags to an empty array, never undefined', async () => {
    await service.createRun({ prompt: 'p', sessionId: 's1', workspaceId: 'w1' });
    const call = prisma.calls.find((c) => c.op === 'create' && c.model === 'run');
    expect(call!.args.data.tags).toBe('[]');

    prisma.returns.run = rawRun({ tags: 'not json' });
    const run = await service.findRunWithEvents({ runId: 'r1' });
    expect(run!.tags).toEqual([]);
  });

  it('asks for runs carrying EVERY tag, so "mine and in flight" is one query', async () => {
    await service.findAllRuns({ tags: ['job-hunt', 'matching'], status: RunStatus.RUNNING });
    const call = prisma.calls.find((c) => c.op === 'findMany' && c.model === 'run');
    expect(call!.args.where).toEqual({
      status: RunStatus.RUNNING,
      AND: [
        { tags: { contains: '"job-hunt"' } },
        { tags: { contains: '"matching"' } },
      ],
    });
  });

  it('does not filter when no tag or status is given', async () => {
    await service.findAllRuns();
    const call = prisma.calls.find((c) => c.op === 'findMany' && c.model === 'run');
    expect(call!.args.where).toEqual({});
  });

  it('returns an empty array, not undefined, when there are no runs', async () => {
    prisma.returns.runs = [];
    await expect(service.findAllRuns()).resolves.toEqual([]);
  });

  it('reports how many runs it stopped', async () => {
    await expect(service.stopAllRunningRuns()).resolves.toBe(2);
    const call = prisma.calls.find((c) => c.op === 'updateMany');
    expect(call!.args.where.status).toBe(RunStatus.RUNNING);
    expect(call!.args.data.status).toBe(RunStatus.STOPPED);
  });

  it('never lets a storeEvent failure escape into the run', async () => {
    prisma.runEvent.create = () => Promise.reject(new Error('db gone')) as never;
    await expect(
      service.storeEvent({ runId: 'r1', sequence: 1, event: { type: 'text' } }),
    ).resolves.toBeUndefined();
  });
});
