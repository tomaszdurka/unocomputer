import type { INestApplication } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import request from 'supertest';
import { WorkspacesController } from './workspaces.controller';
import { PersistenceService } from '../database/persistence.service';
import { createHttpTestApp, emptyPage } from '../test/http-harness';

// `?directory=` is the lookup a caller makes before creating a workspace ("is this folder
// already one?"). It is a declared query parameter, so it shares the fate of every other
// filter under forbidNonWhitelisted - see runs.controller.spec.ts.

describe('WorkspacesController (HTTP)', () => {
  let app: INestApplication;
  let findAllWorkspaces: jest.Mock;
  let findWorkspaceByWorkingDir: jest.Mock;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.realpathSync.native(
      fs.mkdtempSync(path.join(os.tmpdir(), 'uno-ws-')),
    );
    findAllWorkspaces = jest.fn().mockResolvedValue(emptyPage());
    findWorkspaceByWorkingDir = jest.fn().mockResolvedValue(null);
    app = await createHttpTestApp({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: PersistenceService,
          useValue: {
            findAllWorkspaces,
            findWorkspaceByWorkingDir,
            findWorkspaceWithRuns: jest.fn().mockResolvedValue(null),
            getWorkspace: jest.fn().mockResolvedValue(null),
            updateWorkspace: jest.fn().mockResolvedValue(null),
            createWorkspace: jest.fn(),
          },
        },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const get = (url: string) => request(app.getHttpServer()).get(url);

  describe('GET /api/workspaces', () => {
    it('lists a page with the default size when given no parameters', async () => {
      await get('/api/workspaces').expect(200);
      expect(findAllWorkspaces).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, pageSize: 100 }),
      );
    });

    it('accepts the directory lookup', async () => {
      const res = await get(
        `/api/workspaces?directory=${encodeURIComponent(tmpDir)}`,
      ).expect(200);
      expect(findWorkspaceByWorkingDir).toHaveBeenCalledWith({
        workingDir: tmpDir,
      });
      expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 100 });
    });

    it('returns the one workspace bound to a folder, in the list envelope', async () => {
      findWorkspaceByWorkingDir.mockResolvedValue({
        workspaceId: 'w1',
        workingDir: tmpDir,
      });
      const res = await get(
        `/api/workspaces?directory=${encodeURIComponent(tmpDir)}`,
      ).expect(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].workspaceId).toBe('w1');
      expect(res.body.total).toBe(1);
    });

    it('reports a folder that does not exist as simply having no workspace', async () => {
      const res = await get(
        '/api/workspaces?directory=%2Fno%2Fsuch%2Ffolder',
      ).expect(200);
      expect(res.body).toEqual({ items: [], total: 0, page: 1, pageSize: 100 });
      expect(findWorkspaceByWorkingDir).not.toHaveBeenCalled();
    });

    it('rejects a query parameter no DTO declares', async () => {
      await get('/api/workspaces?mystery=1').expect(400);
      expect(findAllWorkspaces).not.toHaveBeenCalled();
    });

    it('rejects an out-of-range pageSize', async () => {
      await get('/api/workspaces?pageSize=101').expect(400);
    });
  });

  describe('POST /api/workspaces', () => {
    const post = (body: object) =>
      request(app.getHttpServer()).post('/api/workspaces').send(body);

    it('refuses a relative directory', async () => {
      const res = await post({ directory: 'relative/path' }).expect(400);
      expect(JSON.stringify(res.body)).toContain('absolute');
    });

    it('refuses a directory that does not exist', async () => {
      await post({ directory: '/no/such/folder' }).expect(400);
    });

    it('refuses a path that is a file rather than a directory', async () => {
      const file = path.join(tmpDir, 'a-file.txt');
      fs.writeFileSync(file, 'x');
      const res = await post({ directory: file }).expect(400);
      expect(JSON.stringify(res.body)).toContain('not a directory');
    });

    it('409s when the folder already belongs to a workspace', async () => {
      findWorkspaceByWorkingDir.mockResolvedValue({
        workspaceId: 'w-existing',
        workingDir: tmpDir,
      });
      const res = await post({ directory: tmpDir }).expect(409);
      expect(JSON.stringify(res.body)).toContain('w-existing');
    });
  });

  describe('GET /api/workspaces/:id/files/:filename', () => {
    it('allows only the whitelisted filename', async () => {
      const res = await get('/api/workspaces/w1/files/.env').expect(400);
      expect(JSON.stringify(res.body)).toContain('not allowed');
    });
  });
});
