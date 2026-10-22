import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  ProvidersController,
  SettingsController,
} from './providers.controller';
import { ProvidersService } from './providers.service';
import { SettingsService } from '../settings/settings.service';
import { createHttpTestApp } from '../test/http-harness';
import * as whichModule from './which';

// The real ProvidersService over a fake SettingsService and a stubbed PATH
// lookup, so the rules - unknown provider, disabled provider, the default's
// provider cannot be disabled - are tested where callers meet them.

describe('Providers and settings (HTTP)', () => {
  let app: INestApplication;
  let store: Record<string, unknown>;
  let installed: Set<string>;

  beforeEach(async () => {
    store = {};
    installed = new Set(['claude', 'codex']);
    jest
      .spyOn(whichModule, 'which')
      .mockImplementation((binary) =>
        installed.has(binary) ? `/usr/local/bin/${binary}` : null,
      );

    const settings: Partial<SettingsService> = {
      getModelPreferences: async () =>
        (store.modelPreferences as string[] | null) ??
        (store.defaultModel ? [store.defaultModel as string] : null),
      setModelPreferences: async (models: string[]) => {
        store.modelPreferences = models;
      },
      isProviderEnabled: async (id) =>
        (store[`providers.${id}.enabled`] as boolean | undefined) ?? true,
      setProviderEnabled: async (id, enabled) => {
        store[`providers.${id}.enabled`] = enabled;
      },
    };

    app = await createHttpTestApp({
      controllers: [ProvidersController, SettingsController],
      providers: [
        ProvidersService,
        { provide: SettingsService, useValue: settings },
      ],
    });
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  const get = (url: string) => request(app.getHttpServer()).get(url);
  const patch = (url: string, body: object) =>
    request(app.getHttpServer()).patch(url).send(body);

  describe('GET /api/providers', () => {
    it('lists every provider with availability from PATH and enabled by default', async () => {
      const res = await get('/api/providers').expect(200);
      const byId = Object.fromEntries(
        res.body.map((p: { id: string }) => [p.id, p]),
      );
      expect(Object.keys(byId).sort()).toEqual([
        'claude',
        'codex',
        'devin',
        'gemini',
      ]);
      expect(byId.claude).toMatchObject({
        available: true,
        path: '/usr/local/bin/claude',
        enabled: true,
        pinnable: true,
      });
      expect(byId.devin).toMatchObject({
        available: false,
        path: null,
        enabled: true,
      });
      expect(byId.gemini.available).toBe(false);
    });
  });

  describe('PATCH /api/providers/:id', () => {
    it('disables and re-enables a provider', async () => {
      const off = await patch('/api/providers/devin', {
        enabled: false,
      }).expect(200);
      expect(off.body.enabled).toBe(false);
      const list = await get('/api/providers').expect(200);
      expect(
        list.body.find((p: { id: string }) => p.id === 'devin').enabled,
      ).toBe(false);
      const on = await patch('/api/providers/devin', { enabled: true }).expect(
        200,
      );
      expect(on.body.enabled).toBe(true);
    });

    it('404s for a provider that does not exist', async () => {
      await patch('/api/providers/jev', { enabled: false }).expect(404);
    });

    it('rejects a body that is not { enabled: boolean }', async () => {
      await patch('/api/providers/devin', { enabled: 'no' }).expect(400);
      await patch('/api/providers/devin', {
        enabled: false,
        mystery: 1,
      }).expect(400);
    });
  });

  describe('GET/PATCH /api/settings', () => {
    it('starts with every provider in registry order, and says which one a run would get', async () => {
      const res = await get('/api/settings').expect(200);
      expect(res.body.modelPreferences).toEqual([
        'claude',
        'codex',
        'gemini',
        'devin',
      ]);
      expect(res.body.effectiveModel).toBe('claude');
      expect(res.body.skipped).toEqual([]);
    });

    it('stores an order and pads it with the providers not listed', async () => {
      const res = await patch('/api/settings', {
        modelPreferences: ['devin', 'codex:o3'],
      }).expect(200);
      expect(res.body.modelPreferences).toEqual([
        'devin',
        'codex:o3',
        'claude',
        'gemini',
      ]);
      expect((await get('/api/settings')).body.modelPreferences).toEqual([
        'devin',
        'codex:o3',
        'claude',
        'gemini',
      ]);
    });

    it('skips a preference whose provider is not installed, and says so', async () => {
      const res = await patch('/api/settings', {
        modelPreferences: ['devin', 'claude'],
      }).expect(200);
      expect(res.body.effectiveModel).toBe('claude');
      expect(res.body.skipped).toEqual([
        { model: 'devin', reason: 'no "devin" on PATH' },
      ]);
    });

    it('skips a preference whose provider is disabled - which is why disabling is always allowed', async () => {
      await patch('/api/providers/claude', { enabled: false }).expect(200);
      const res = await get('/api/settings').expect(200);
      expect(res.body.effectiveModel).toBe('codex');
      expect(res.body.skipped).toEqual([
        { model: 'claude', reason: 'disabled' },
      ]);
    });

    it('reports null when nothing is usable', async () => {
      await patch('/api/providers/claude', { enabled: false }).expect(200);
      await patch('/api/providers/codex', { enabled: false }).expect(200);
      const res = await get('/api/settings').expect(200);
      expect(res.body.effectiveModel).toBeNull();
      expect(res.body.skipped).toHaveLength(4);
    });

    it('reads a defaultModel stored before preferences existed as the head of the list', async () => {
      store.defaultModel = 'codex';
      const res = await get('/api/settings').expect(200);
      expect(res.body.modelPreferences[0]).toBe('codex');
    });

    it('collapses duplicates to their first position', async () => {
      const res = await patch('/api/settings', {
        modelPreferences: ['codex', 'claude', 'codex'],
      }).expect(200);
      expect(res.body.modelPreferences).toEqual([
        'codex',
        'claude',
        'gemini',
        'devin',
      ]);
    });

    it('rejects an unknown provider, naming the known ones', async () => {
      const res = await patch('/api/settings', {
        modelPreferences: ['jev'],
      }).expect(400);
      expect(JSON.stringify(res.body)).toContain(
        'claude, codex, gemini, devin',
      );
    });

    it('rejects an empty list and a malformed entry before the registry sees them', async () => {
      await patch('/api/settings', { modelPreferences: [] }).expect(400);
      await patch('/api/settings', {
        modelPreferences: ['Claude Code'],
      }).expect(400);
      await patch('/api/settings', { modelPreferences: 'claude' }).expect(400);
    });
  });

  describe('resolveModel (what run creation calls)', () => {
    const service = () => app.get(ProvidersService);

    it('takes the request, then the session, then the default', async () => {
      expect((await service().resolveModel('codex', 'claude')).model).toBe(
        'codex',
      );
      expect((await service().resolveModel(undefined, 'codex')).model).toBe(
        'codex',
      );
      expect((await service().resolveModel(undefined, null)).model).toBe(
        'claude',
      );
    });

    it('splits a pinned model for the CLI', async () => {
      await expect(
        service().resolveModel('claude:opus', null),
      ).resolves.toEqual({
        model: 'claude:opus',
        providerId: 'claude',
        cliModel: 'opus',
      });
    });

    it('refuses a provider that is not installed, saying which binary is missing', async () => {
      await expect(service().resolveModel('gemini', null)).rejects.toThrow(
        '"gemini" on PATH',
      );
    });

    it('refuses a provider that is disabled', async () => {
      await patch('/api/providers/codex', { enabled: false }).expect(200);
      await expect(service().resolveModel('codex', null)).rejects.toThrow(
        'disabled',
      );
    });
  });
});
