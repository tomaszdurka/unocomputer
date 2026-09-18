import { ApiError, listRuns, getRun, queueRun, deletePrompt, createWorkspace, createSession, updateSession } from './api';

// api.ts picks its transport from `typeof window`. Under jsdom a window exists, so these
// exercise the browser path: same-origin /api/*, which the route handler proxies to the
// backend socket. The server path talks to the socket directly and is covered end to end
// rather than here.

describe('api client (browser transport)', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  const ok = (body: unknown) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

  it('prefixes every path with /api so it goes through the proxy', async () => {
    fetchMock.mockReturnValue(ok([]));
    await listRuns();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/runs');
  });

  it('never serves a cached response', async () => {
    fetchMock.mockReturnValue(ok([]));
    await listRuns();
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ cache: 'no-store' });
  });

  it('interpolates path parameters', async () => {
    fetchMock.mockReturnValue(ok({ runId: 'abc' }));
    await getRun('abc');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/runs/abc');
  });

  it('posts JSON with a content-type', async () => {
    fetchMock.mockReturnValue(ok({ runId: 'r1' }));
    await queueRun({ prompt: 'hi' });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/runs/queue');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ prompt: 'hi' });
  });

  it('sends DELETE without a body', async () => {
    fetchMock.mockReturnValue(ok(null));
    await deletePrompt('p1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/prompts/p1');
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('throws with the status and path when the API rejects', async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve(null) }));
    await expect(getRun('missing')).rejects.toThrow('API 404: /runs/missing');
  });

  it('surfaces the backend message when the API rejects with one', async () => {
    fetchMock.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ statusCode: 409, message: '/repo already belongs to workspace w1' }),
      }),
    );
    const failure = createWorkspace({ directory: '/repo' });
    await expect(failure).rejects.toThrow('/repo already belongs to workspace w1');
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(failure).rejects.toMatchObject({ status: 409 });
  });

  it('joins validation messages, which Nest sends as a list', async () => {
    fetchMock.mockReturnValue(
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: ['directory should not be empty', 'name must be a string'] }),
      }),
    );
    await expect(createWorkspace({ directory: '' })).rejects.toThrow(
      'directory should not be empty; name must be a string',
    );
  });

  it('creates a session in a workspace', async () => {
    fetchMock.mockReturnValue(ok({ sessionId: 's1' }));
    await createSession({ workspaceId: 'w1', name: 'first' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/sessions');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ workspaceId: 'w1', name: 'first' });
  });

  it('renames a session with PATCH', async () => {
    fetchMock.mockReturnValue(ok({ sessionId: 's1', name: 'renamed' }));
    await updateSession('s1', { name: 'renamed' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/sessions/s1');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(init.body)).toEqual({ name: 'renamed' });
  });
});
