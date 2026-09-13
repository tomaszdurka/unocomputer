# UnoComputer 🎯

> Local Model API with Claude CLI integration and workspace isolation

**UnoComputer** is a TypeScript + NestJS API server that enables programmatic execution of Claude CLI commands with structured JSON output.

## Features

- 🚀 Execute Claude CLI commands via REST API
- 📦 Automatic workspace isolation with persistent sessions
- 🔄 Two response modes: buffered JSON or streaming JSONL
- 📝 JSON schema validation for structured outputs
- 🔁 Session management for conversation continuity
- 💾 SQLite persistence with MikroORM
- 🎨 Next.js 16 dashboard UI for monitoring and management
- 📊 Built-in state tracking across runs

## ⚠️ Disclaimer

**USE AT YOUR OWN RISK.** UnoComputer executes Claude CLI commands programmatically and can run arbitrary code within isolated workspaces.

- **Security**: Exposing this API to untrusted networks or users can pose significant security risks
- **Responsibility**: You are solely responsible for securing, monitoring, and managing any deployment of UnoComputer
- **No Warranty**: This software is provided "as is" without warranty of any kind
- **Production Use**: Implement proper authentication, rate limiting, input validation, and network security before any production deployment

By using UnoComputer, you acknowledge and accept these risks and responsibilities.

## Quick Start

```bash
pnpm install
pnpm dev          # runs backend + admin in parallel
```

There is only ever **one** port, and the browser only ever talks to the admin.
The backend binds no TCP port at all: it listens on the unix socket
`data/backend.sock`, and the admin proxies `/api/*` to it.

| | URL |
| --- | --- |
| Dev | OS-assigned - `pnpm dev` prints `- Local: http://localhost:<port>` |
| Deployed | http://unocomputer.localhost (Caddy -> 127.0.0.1:7802) |
| API docs | `<base>/api` (swagger UI), `<base>/api/openapi.json` (raw spec) |

Dev deliberately defaults to `PORT=0` so it never collides with another
checkout, worktree, or a running deployment. Pin it with `PORT=4100 pnpm dev`
if you want a stable URL for a while.

### Deploy locally

```bash
pnpm deploy:local             # build, install as launchd agents, register with Caddy
pnpm deploy:local status      # service state + health
pnpm deploy:local logs        # tail both logs
pnpm deploy:local uninstall   # remove services, keep the database
```

This runs the app in the background across reboots, with its own database at
`~/Library/Application Support/unocomputer/data/unocomputer.db` - entirely
separate from whatever your dev server is using. The port is allocated from
7800 up by scanning `$(brew --prefix)/etc/caddy.d`, which doubles as the
registry shared with other apps deployed the same way.

## Example Usage

### Buffered Mode (with schema)

```bash
curl -X POST http://unocomputer.localhost/api/runs \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "prompt": "What is 2+2?",
    "schema": {
      "type": "object",
      "properties": {
        "answer": { "type": "number" }
      },
      "required": ["answer"]
    }
  }'
```

### Streaming Mode

```bash
curl -X POST http://unocomputer.localhost/api/runs \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{
    "prompt": "Explain how TypeScript generics work"
  }'
```

## Dashboard UI

UnoComputer includes a Next.js 16 dashboard for visual management:

- **Runs** - View all Claude CLI executions with status, results, and logs
- **Workspaces** - Manage isolated project environments
- **Sessions** - Track conversation continuity across multiple runs

Access the dashboard at `http://unocomputer.localhost` once deployed, or at the
OS-assigned port `pnpm dev` prints.

## Documentation

See [SPEC.md](./SPEC.md) for complete API documentation and architecture details.

## License

ISC
