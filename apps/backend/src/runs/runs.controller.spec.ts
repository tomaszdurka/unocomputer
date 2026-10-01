import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';
import { PersistenceService } from '../database/persistence.service';
import { createHttpTestApp, emptyPage } from '../test/http-harness';
import { RunStatus } from '../database/run-status';

// GET /api/runs is the endpoint that broke when pagination landed: the global pipe runs
// with forbidNonWhitelisted, so `?tag=` and `?status=` started coming back 400 while the
// bare `GET /api/runs` a smoke test checks kept working. These tests drive the real pipe
// and the real DTO, which is the only way that class of regression is visible.

describe('RunsController (HTTP)', () => {
  let app: INestApplication;
  let findAllRuns: jest.Mock;
  let findRunWithEvents: jest.Mock;

  beforeEach(async () => {
    findAllRuns = jest.fn().mockResolvedValue(emptyPage());
    findRunWithEvents = jest.fn().mockResolvedValue(null);
    app = await createHttpTestApp({
      controllers: [RunsController],
      providers: [
        { provide: PersistenceService, useValue: { findAllRuns, findRunWithEvents } },
        { provide: RunsService, useValue: { run: jest.fn() } },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const get = (url: string) => request(app.getHttpServer()).get(url);

  describe('filters stay accepted', () => {
    it('accepts a single tag and passes it as a list', async () => {
      await get('/api/runs?tag=nightly').expect(200);
      expect(findAllRuns).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tags: ['nightly'] }),
      );
    });

    it('accepts a repeated tag and requires every one of them', async () => {
      await get('/api/runs?tag=nightly&tag=ci').expect(200);
      expect(findAllRuns).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ tags: ['nightly', 'ci'] }),
      );
    });

    it('accepts a known status', async () => {
      await get(`/api/runs?status=${RunStatus.RUNNING}`).expect(200);
      expect(findAllRuns).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ status: RunStatus.RUNNING }),
      );
    });

    it('accepts a tag and a status together, alongside paging', async () => {
      await get(`/api/runs?tag=ci&status=${RunStatus.RUNNING}&page=2&pageSize=25`).expect(200);
      const [pagination, filters] = findAllRuns.mock.calls[0];
      expect(filters).toEqual(expect.objectContaining({ tags: ['ci'], status: RunStatus.RUNNING }));
      expect(pagination).toEqual(expect.objectContaining({ page: 2, pageSize: 25 }));
    });
  });

  describe('paging', () => {
    it('defaults to the first page of 100', async () => {
      await get('/api/runs').expect(200);
      expect(findAllRuns.mock.calls[0][0]).toEqual(
        expect.objectContaining({ page: 1, pageSize: 100 }),
      );
    });

    it('parses page and pageSize as numbers, not strings', async () => {
      await get('/api/runs?page=3&pageSize=10').expect(200);
      const pagination = findAllRuns.mock.calls[0][0];
      expect(pagination.page).toBe(3);
      expect(pagination.pageSize).toBe(10);
    });

    it('caps pageSize so one request cannot pull the whole table', async () => {
      await get('/api/runs?pageSize=100000').expect(400);
      expect(findAllRuns).not.toHaveBeenCalled();
    });

    it.each(['0', '-3', 'abc'])('rejects page=%s', async (page) => {
      await get(`/api/runs?page=${page}`).expect(400);
      expect(findAllRuns).not.toHaveBeenCalled();
    });
  });

  describe('validation boundaries', () => {
    it('rejects an unknown status rather than silently ignoring it', async () => {
      await get('/api/runs?status=not-a-status').expect(400);
      expect(findAllRuns).not.toHaveBeenCalled();
    });

    // This is the behaviour that caused the original outage. Pinning it means anyone
    // adding a filter sees a red test until the DTO declares it.
    it('rejects a query parameter no DTO declares', async () => {
      const res = await get('/api/runs?mystery=1').expect(400);
      expect(JSON.stringify(res.body)).toContain('mystery');
      expect(findAllRuns).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/runs/:runId', () => {
    it('404s for a run that does not exist', async () => {
      await get('/api/runs/does-not-exist').expect(404);
    });

    it('returns the run when it exists', async () => {
      findRunWithEvents.mockResolvedValue({ runId: 'r1', status: RunStatus.SUCCESS });
      const res = await get('/api/runs/r1').expect(200);
      expect(res.body.runId).toBe('r1');
    });
  });
});
