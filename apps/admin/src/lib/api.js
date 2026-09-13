// Two transports, one API surface.
//
// Browser: same-origin `/api/*`, which src/app/api/[[...path]]/route.js proxies to the
//          backend's unix socket. The backend has no TCP port, so this is the only way in.
// Server:  talk to the socket directly. Routing a server component's fetch back through
//          our own port just to reach the proxy would be a pointless extra hop.

const isServer = typeof window === 'undefined';

async function serverRequest(path, options = {}) {
  const [{ default: http }, { resolve }] = await Promise.all([
    import('node:http'),
    import('node:path'),
  ]);

  const socketPath =
    process.env.BACKEND_SOCKET ?? resolve(process.cwd(), '../../data/backend.sock');

  return new Promise((resolvePromise, reject) => {
    const req = http.request(
      {
        socketPath,
        path: `/api${path}`,
        method: options.method ?? 'GET',
        headers: options.headers ?? {},
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
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

async function browserRequest(path, options = {}) {
  const res = await fetch(`/api${path}`, { cache: 'no-store', ...options });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json();
}

function request(path, options = {}) {
  return isServer ? serverRequest(path, options) : browserRequest(path, options);
}

export async function listRuns() {
  return request('/runs');
}

export async function getRun(runId) {
  return request(`/runs/${runId}`);
}

export async function listWorkspaces() {
  return request('/workspaces');
}

export async function getWorkspace(workspaceId) {
  return request(`/workspaces/${workspaceId}`);
}

export async function updateWorkspace(workspaceId, data) {
  return request(`/workspaces/${workspaceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function getWorkspaceFile(workspaceId, filename) {
  return request(`/workspaces/${workspaceId}/files/${filename}`);
}

export async function queueRun(data) {
  return request('/runs/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function listSessions() {
  return request('/sessions');
}

export async function getSession(sessionId) {
  return request(`/sessions/${sessionId}`);
}

export async function listPrompts() {
  return request('/prompts');
}

export async function getPrompt(promptId) {
  return request(`/prompts/${promptId}`);
}

export async function createPrompt(data) {
  return request('/prompts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function updatePrompt(promptId, data) {
  return request(`/prompts/${promptId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function deletePrompt(promptId) {
  return request(`/prompts/${promptId}`, {
    method: 'DELETE'
  });
}
