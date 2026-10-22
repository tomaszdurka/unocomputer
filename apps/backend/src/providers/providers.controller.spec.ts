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
      getDefaultModel: async () =>
        (store.defaultModel as string | null) ?? null,
      setDefaultModel: async (model) => {
        store.defaultModel = model;
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

    it('refuses to disable the provider of the default model', async () => {
      const res = await patch('/api/providers/claude', {
        enabled: false,
      }).expect(400);
      expect(JSON.stringify(res.body)).toContain('default');
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
    it('defaults to the first provider until something is set', async () => {
      const res = await get('/api/settings').expect(200);
      expect(res.body).toEqual({ defaultModel: 'claude' });
    });

    it('stores a default with a pinned model', async () => {
      const res = await patch('/api/settings', {
        defaultModel: 'claude:sonnet',
      }).expect(200);
      expect(res.body).toEqual({ defaultModel: 'claude:sonnet' });
      expect((await get('/api/settings')).body.defaultModel).toBe(
        'claude:sonnet',
      );
    });

    it('accepts a provider that is enabled but not installed', async () => {
      await patch('/api/settings', { defaultModel: 'devin' }).expect(200);
    });

    it('rejects an unknown provider, naming the known ones', async () => {
      const res = await patch('/api/settings', { defaultModel: 'jev' }).expect(
        400,
      );
      expect(JSON.stringify(res.body)).toContain(
        'claude, codex, gemini, devin',
      );
    });

    it('rejects a model suffix on a provider that cannot pin one', async () => {
      await patch('/api/settings', { defaultModel: 'codex:o3' }).expect(400);
    });

    it('rejects a disabled provider as the default', async () => {
      await patch('/api/providers/devin', { enabled: false }).expect(200);
      const res = await patch('/api/settings', {
        defaultModel: 'devin',
      }).expect(400);
      expect(JSON.stringify(res.body)).toContain('disabled');
    });

    it('rejects a malformed defaultModel before it reaches the registry', async () => {
      await patch('/api/settings', { defaultModel: 'Claude Code' }).expect(400);
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
