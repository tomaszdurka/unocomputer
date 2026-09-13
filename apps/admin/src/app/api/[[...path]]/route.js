import http from 'node:http';
import { Readable } from 'node:stream';
import { resolve } from 'node:path';

// Proxies /api/* to the backend's unix domain socket. The backend is not exposed on any
// TCP port; this route is its only public entrance (REST API and docs included:
// /api serves the swagger UI). The path is forwarded unchanged - the backend serves
// everything under /api.
//
// This streams the upstream response instead of buffering it. UnoComputer's run
// endpoints emit JSONL incrementally (`Accept: application/x-ndjson`), and a buffering
// proxy would hold every event until the run finished, turning a live stream into one
// blob at the end.
const socketPath =
  process.env.BACKEND_SOCKET ?? resolve(process.cwd(), '../../data/backend.sock');

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
  'proxy-authenticate',
  'proxy-authorization',
  'host',
  'content-length',
]);

function proxy(req) {
  const url = new URL(req.url);

  const headers = {};
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key)) headers[key] = value;
  });

  return new Promise((resolvePromise) => {
    const upstream = http.request(
      {
        socketPath,
        path: url.pathname + url.search,
        method: req.method,
        headers,
      },
      (res) => {
        const responseHeaders = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (HOP_BY_HOP.has(key) || value === undefined) continue;
          responseHeaders.set(key, Array.isArray(value) ? value.join(', ') : value);
        }

        const status = res.statusCode ?? 502;
        // 204/304 must not carry a body.
        const body = status === 204 || status === 304 ? null : Readable.toWeb(res);

        resolvePromise(new Response(body, { status, headers: responseHeaders }));
      },
    );

    upstream.on('error', (err) =>
      resolvePromise(
        new Response(`Backend unavailable: ${err.message}`, { status: 502 }),
      ),
    );

    // Abort the upstream request when the client disconnects mid-stream, so a cancelled
    // run stops being written to a socket nobody is reading.
    req.signal?.addEventListener('abort', () => upstream.destroy());

    if (req.method === 'GET' || req.method === 'HEAD') {
      upstream.end();
    } else if (req.body) {
      Readable.fromWeb(req.body).pipe(upstream);
    } else {
      upstream.end();
    }
  });
}

export const dynamic = 'force-dynamic';

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
  proxy as HEAD,
  proxy as OPTIONS,
};
