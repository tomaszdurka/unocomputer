import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { SessionsController } from './sessions.controller';
import { PersistenceService } from '../database/persistence.service';
import { createHttpTestApp, emptyPage } from '../test/http-harness';

const WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('SessionsController (HTTP)', () => {
  let app: INestApplication;
  let findAllSessions: jest.Mock;
  let getWorkspace: jest.Mock;
  let createSession: jest.Mock;
  let findSessionWithRuns: jest.Mock;

  beforeEach(async () => {
    findAllSessions = jest.fn().mockResolvedValue(emptyPage());
    getWorkspace = jest.fn().mockResolvedValue(null);
    createSession = jest.fn().mockResolvedValue({ sessionId: 's1' });
    findSessionWithRuns = jest.fn().mockResolvedValue(null);
    app = await createHttpTestApp({
      controllers: [SessionsController],
      providers: [
        {
          provide: PersistenceService,
          useValue: {
            findAllSessions,
            getWorkspace,
            createSession,
            findSessionWithRuns,
            updateSession: jest.fn().mockResolvedValue(null),
          },
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
  });

  const get = (url: string) => request(app.getHttpServer()).get(url);
  const post = (body: object) =>
    request(app.getHttpServer()).post('/api/sessions').send(body);

  describe('GET /api/sessions', () => {
    it('lists a page with the default size', async () => {
      const res = await get('/api/sessions').expect(200);
      expect(findAllSessions).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 100 }),
      );
      expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 100 });
    });

    it('passes paging through as numbers', async () => {
      await get('/api/sessions?page=4&pageSize=20').expect(200);
      const pagination = findAllSessions.mock.calls[0][0];
      expect(pagination.page).toBe(4);
      expect(pagination.pageSize).toBe(20);
    });

    it('rejects a query parameter no DTO declares', async () => {
      await get('/api/sessions?mystery=1').expect(400);
      expect(findAllSessions).not.toHaveBeenCalled();
    });

    it('rejects a pageSize above the cap', async () => {
      await get('/api/sessions?pageSize=500').expect(400);
    });
  });

  describe('POST /api/sessions', () => {
    it('404s when the workspace does not exist', async () => {
      const res = await post({ workspaceId: 'deadbeef-0000' }).expect(404);
      expect(JSON.stringify(res.body)).toContain('deadbeef-0000');
      expect(createSession).not.toHaveBeenCalled();
    });

    it('creates the session against the resolved workspace', async () => {
      getWorkspace.mockResolvedValue({ workspaceId: WORKSPACE_ID });
      const res = await post({
        workspaceId: WORKSPACE_ID,
        name: 'implement-login',
      }).expect(201);
      expect(createSession).toHaveBeenCalledWith({
        workspaceId: WORKSPACE_ID,
        name: 'implement-login',
      });
      expect(res.body.sessionId).toBe('s1');
    });

    it('refuses a workspaceId that is not uuid-shaped', async () => {
      // This is also what keeps the id safe to interpolate into the shell commands the
      // codex and gemini services use to find a resumable CLI session.
      await post({ workspaceId: 'w1; rm -rf /' }).expect(400);
      expect(getWorkspace).not.toHaveBeenCalled();
    });

    it('requires a workspaceId', async () => {
      await post({ name: 'orphan' }).expect(400);
    });

    it('rejects a body property no DTO declares', async () => {
      await post({ workspaceId: WORKSPACE_ID, mystery: 1 }).expect(400);
    });
  });

  describe('GET /api/sessions/:sessionId', () => {
    it('404s for a session that does not exist', async () => {
      await get('/api/sessions/nope').expect(404);
    });
  });
});
