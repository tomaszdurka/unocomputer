# UnoComputer - Agent Development Guide

## Project Overview

**UnoComputer** is a NestJS-based REST API that acts as a bridge between HTTP clients and the Claude CLI. It enables programmatic execution of Claude CLI commands with workspace isolation, streaming support, and structured JSON output.

### Core Concept

- **HTTP API → Claude CLI**: Transform HTTP requests into `claude` command executions
- **Workspace Isolation**: Each run operates in an isolated directory under `workspaces/`
- **Dual Response Modes**: Buffered JSON or streaming JSONL based on `Accept` header
- **State Persistence**: Workspaces can be reused across runs for continuity

## Architecture

### Key Components

```
src/
├── main.ts                    # NestJS bootstrap, port 3100
├── app.module.ts              # Root module (imports RunsModule, ConfigModule)
├── claude/
│   ├── claude.module.ts       # Provides ClaudeService
│   └── claude.service.ts      # Claude CLI execution logic
├── workspaces/
│   ├── workspaces.controller.ts # Workspace CRUD operations
│   └── dto/
│       └── create-workspace.dto.ts # Workspace creation with optional agentsMd
└── runs/
    ├── runs.module.ts         # Provides RunsService, RunsController
    ├── runs.controller.ts     # POST /runs endpoint handler
    ├── runs.service.ts        # Run execution and provider routing
    └── dto/
        └── run.dto.ts         # Request validation (prompt, schema?, workspaceId?, sessionId?)
```

### Service Responsibilities

**RunsService**
- `ensureWorkspace(existingWorkspaceId?)`: Creates new workspace or validates existing one
- `executeJsonStream()`: Generic utility for running commands that output JSONL
- Uses `WORKSPACES_DIR` env var (default: `./workspaces`)

**ClaudeService**
- `run(options)`: Execute Claude CLI
- Creates initial `CLAUDE.md` in workspace (reference file pointing to AGENTS.md)
- First run uses: `claude --session-id <id> -p <prompt> --output-format stream-json --verbose --permission-mode bypassPermissions`
- Subsequent runs use: `claude --resume <session-id> -p <prompt> ...`
- Strips `CLAUDE_CODE` and `CLAUDECODE` from environment to avoid nesting

**WorkspacesController**
- `POST /workspaces`: Create workspace with optional `agentsMd` content
- `GET /workspaces`: List all workspaces
- `GET /workspaces/:id`: Get workspace details
- `PATCH /workspaces/:id`: Update workspace properties

**Workspace Files**
- `AGENTS.md`: Optional project guidelines (created via POST /workspaces with `agentsMd` param)
- `CLAUDE.md`: Auto-generated reference file pointing to AGENTS.md

### Request Flow

1. Client sends POST to `/runs/claude` with `{ prompt, schema?, workspaceId? }`
2. `RunsController` validates via `RunDto`
3. `RunsService.ensureWorkspace()` creates/reuses workspace
4. Controller determines mode from `Accept` header
5. `ClaudeService.run()` executes Claude CLI
6. Events streamed to client or buffered for single response

### Response Modes

**Buffered** (`Accept: application/json`):
- Single JSON response with `type: "result"` event
- Includes `workspaceId`, `runId`, `timestamp`

**Streaming** (`Accept: application/x-ndjson`):
- JSONL stream of all events from Claude CLI
- Each line augmented with `workspaceId`, `runId`, `timestamp`
- Client disconnect handling

## Development Guidelines

### When Modifying Code

**Adding Features**
- Follow existing NestJS patterns (modules, services, controllers)
- Keep workspace isolation intact
- Maintain both streaming and buffered modes
- Update SPEC.md if API changes

**Workspace State Files**
- `CLAUDE.md`: Generated reference (points to AGENTS.md)
- `AGENTS.md`: Optional project guidelines (created via API)

**Error Handling**
- Use NestJS exceptions (`BadRequestException`, etc.)
- Validate workspaceId exists before reuse (400 if not)
- Log JSON parsing errors but don't crash

**Security**
- Never expose without authentication/rate limiting
- Validate all user inputs
- Be cautious with `--permission-mode bypassPermissions`
- Workspace isolation prevents cross-contamination but not malicious prompts

### Key Files to Know

- `src/runs/runs.service.ts`: Run execution and provider routing
- `src/claude/claude.service.ts`: Claude CLI command construction
- `src/workspaces/workspaces.controller.ts`: Workspace creation with agentsMd
- `SPEC.md`: Complete API specification
- `vercel.json`: Deployment config (routes to `server.js`)

### Environment Variables

- `WORKSPACES_DIR`: Custom workspace directory (default: `./workspaces`)
- Load from `.env.local` (gitignored) via ConfigModule

### Testing Locally

```bash
npm run start:dev

# Buffered request
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"prompt": "What is 2+2?"}'

# Streaming request
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{"prompt": "Explain async/await"}'
```

### Deployment Considerations

- **Vercel**: Uses `vercel.json` config, routes all to `server.js`
- **Production**: Add auth, rate limiting, input validation
- **Workspaces**: Consider cleanup strategy for old workspaces
- **Scaling**: Each request spawns a `claude` process - resource intensive

## Common Tasks

### Add New Endpoint
1. Create DTO in `src/runs/dto/`
2. Add method to `RunsController`
3. Implement logic in `RunsService` or new service
4. Update SPEC.md

### Set Workspace Instructions
- Pass `agentsMd` when creating workspace via `POST /workspaces`
- AGENTS.md content is controlled by the caller, not hardcoded

### Change Permission Mode
- Edit `src/claude/claude.service.ts` line 37
- Options: `bypassPermissions`, `plan`, `prompt`

### Add CLI Flags
- Edit `args` array in `src/claude/claude.service.ts`
- Maintain `--output-format stream-json` for parsing

## Important Notes

- **Module Dependency**: `RunsModule` ↔ `ClaudeModule` have circular dependency, resolved via `forwardRef()`
- **Line Buffering**: Critical for JSONL parsing - buffers incomplete lines until `\n` received
- **Process Stdin**: Closed immediately after spawn to prevent hanging
- **Client Disconnects**: Tracked via `res.on('close')` to stop writing events
- **Workspace Persistence**: Workspaces are never auto-deleted, manual cleanup required

## Project Context

This project enables building applications on top of Claude CLI without needing to parse terminal output. It provides a clean HTTP → JSONL bridge with workspace state management.

Use cases:
- CI/CD integrations
- Programmatic code generation
- Multi-step workflows with workspace continuity
- Applications requiring structured Claude responses
