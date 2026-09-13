// Two transports, one API surface.
//
// Browser: same-origin `/api/*`, which src/app/api/[[...path]]/route.ts proxies to the
//          backend's unix socket. The backend has no TCP port, so this is the only way in.
// Server:  talk to the socket directly. Routing a server component's fetch back through
//          our own port just to reach the proxy would be a pointless extra hop.

import type { Prompt, Run, Session, Workspace } from './types';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

const isServer = typeof window === 'undefined';

async function serverRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const [{ default: http }, { resolve }] = await Promise.all([
    import('node:http'),
    import('node:path'),
  ]);

  const socketPath =
    process.env.BACKEND_SOCKET ?? resolve(process.cwd(), '../../data/backend.sock');

  return new Promise<T>((resolvePromise, reject) => {
    const req = http.request(
      {
        socketPath,
        path: `/api${path}`,
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          const status = res.statusCode ?? 502;
          if (status < 200 || status >= 300) {
            reject(new Error(`API ${status}: ${path}`));
            return;
          }
          try {
            resolvePromise(text ? JSON.parse(text) : null);
          } catch {
            reject(new Error(`API ${status}: ${path} returned non-JSON`));
          }
        });
      },
    );
    req.on('error', (err) => reject(new Error(`Backend unavailable: ${err.message}`)));
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function browserRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`/api${path}`, { cache: 'no-store', ...options });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return isServer ? serverRequest<T>(path, options) : browserRequest<T>(path, options);
}

export async function listRuns(): Promise<Run[]> {
  return request<Run[]>('/runs');
}

export async function getRun(runId: string): Promise<Run> {
  return request<Run>(`/runs/${runId}`);
}

export async function listWorkspaces(): Promise<Workspace[]> {
  return request<Workspace[]>('/workspaces');
}

export async function getWorkspace(workspaceId: string): Promise<Workspace> {
  return request<Workspace>(`/workspaces/${workspaceId}`);
}

export async function updateWorkspace(workspaceId: string, data: { name?: string | null }): Promise<Workspace> {
  return request(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function getWorkspaceFile(workspaceId: string, filename: string): Promise<{ content: string }> {
  return request(`/workspaces/${workspaceId}/files/${filename}`);
}

export async function queueRun(data: { prompt: string; schema?: unknown; model?: string; workspaceId?: string; sessionId?: string }): Promise<Run> {
  return request('/runs/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function listSessions(): Promise<Session[]> {
  return request<Session[]>('/sessions');
}

export async function getSession(sessionId: string): Promise<Session> {
  return request<Session>(`/sessions/${sessionId}`);
}

export async function listPrompts(): Promise<Prompt[]> {
  return request<Prompt[]>('/prompts');
}

export async function getPrompt(promptId: string): Promise<Prompt> {
  return request<Prompt>(`/prompts/${promptId}`);
}

export async function createPrompt(data: { name: string; description?: string; prompt: string }): Promise<Prompt> {
  return request('/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updatePrompt(promptId: string, data: { name?: string; description?: string | null; prompt?: string }): Promise<Prompt> {
  return request(`/prompts/${promptId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deletePrompt(promptId: string): Promise<void> {
  return request(`/prompts/${promptId}`, {
    method: 'DELETE'
  });
}
