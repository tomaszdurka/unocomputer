# UnoComputer - Project Specification

## Overview

**UnoComputer** is a TypeScript + NestJS API server that enables programmatic execution of Claude CLI commands with structured JSON output. The system includes SQLite persistence for tracking runs, sessions, and workspaces, plus a Next.js 16 dashboard UI for visual management. The API supports both buffered (single response) and streaming (JSONL) modes, determined by the `Accept` header.

## Core Requirements

### 1. Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: NestJS
- **CLI Integration**: Claude CLI (via `claude` command)

### 2. Key Features
- Execute Claude CLI commands programmatically
- Session management for conversation continuity
- Automatic workspace creation for each run
- Two response modes: buffered JSON and streaming JSONL (based on `Accept` header)
- Structured schema output validation
- Workspace isolation with unique IDs
- SQLite persistence with MikroORM
- Next.js 16 dashboard UI for monitoring runs, sessions, and workspaces
- Lifecycle management with automatic cleanup of interrupted runs

## Session Management

### Overview
Sessions enable conversation continuity across multiple runs. Each session belongs to a workspace and maintains context through Claude CLI's `--session-id` and `--resume` flags.

### How Sessions Work
- **First run in session**: Uses `--session-id {sessionId}` to create a new Claude CLI conversation
- **Subsequent runs**: Uses `--resume {sessionId}` to continue the conversation
- Sessions are tied to workspaces for project isolation
- Multiple sessions can exist within a single workspace (useful for different features/tasks)

### Session Lifecycle
1. Create a new session by providing `workspaceId` in run request
2. Continue existing session by providing `sessionId` in run request
3. Sessions persist indefinitely and can be resumed at any time
4. Each run within a session builds on the conversation history

## API Specification

### Core Endpoints

#### `POST /runs/queue`
Queue a new run (returns immediately)

**Request Body:**
```json
{
  "prompt": "string",           // Required
  "schema": "object?",           // Optional JSON schema
  "workspaceId": "string?",      // Creates new session in workspace
  "sessionId": "string?"         // Continues existing session
}
```

**Response (201):**
```json
{
  "runId": "uuid",
  "sessionId": "uuid",
  "workspaceId": "uuid",
  "status": "queued"
}
```

#### `POST /runs`
Execute run and wait for completion (supports streaming)

Same request body as `/runs/queue`, supports both buffered and streaming modes via `Accept` header.

#### `GET /runs`
List all runs

#### `GET /runs/:runId`
Get run details with events and results

#### `GET /sessions`
List all sessions with workspace info

#### `GET /sessions/:sessionId`
Get session details with all runs

#### `GET /workspaces`
List all workspaces

#### `GET /workspaces/:workspaceId`
Get workspace details with sessions

### Legacy Endpoint: `POST /runs/claude`

#### Request Headers
- `Content-Type: application/json`
- `Accept: application/json` (default, buffered) or `application/x-ndjson` (streaming)

#### Request Body Schema

```json
{
  "prompt": "string",           // Required: Claude CLI prompt
  "schema": "object?",           // Optional: JSON schema for structured output
  "workspaceId": "string?"       // Optional: UUID of existing workspace to reuse
}
```

**Notes:**
- No `workingDirectory` field — each run automatically creates a workspace under `./workspaces/{uuid}/`
- No `stream` field — streaming is determined by the `Accept` header
- Providing `workspaceId` allows reusing an existing workspace for continuity across runs

#### Example Requests

**Buffered Mode (with schema):**
```bash
curl -X POST http://localhost:3100/runs/claude \
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

**Streaming Mode (no schema):**
```bash
curl -X POST http://localhost:3100/runs/claude \
  -H "Content-Type: application/json" \
  -H "Accept: application/x-ndjson" \
  -d '{
    "prompt": "Explain how TypeScript generics work"
  }'
```

### Response Modes

#### Buffered Mode (`Accept: application/json`)

**Response Headers:**
- `Content-Type: application/json`

**Response Body:**
The response returns the result object from Claude CLI's `type: "result"` event, along with workspace metadata.

**Example Success Response:**
```json
{
  "workspaceId": "abc-123-def-456",
  "runId": "xyz-789-uvw-012",
  "timestamp": "2026-03-02T10:30:05.000Z",
  "type": "result",
  "result": {
    "answer": 4
  }
}
```

#### Streaming Mode (`Accept: application/x-ndjson`)

**Response Headers:**
- `Content-Type: application/x-ndjson` (JSONL)
- `Cache-Control: no-cache`

**Response Body (JSONL Stream):**

Each line is a JSON object representing an event:

```jsonl
{"type":"start","workspaceId":"abc-123","runId":"xyz-789","timestamp":"2026-03-02T10:30:00.000Z"}
{"type":"thinking","content":"...","timestamp":"2026-03-02T10:30:01.000Z","workspaceId":"abc-123","runId":"xyz-789"}
{"type":"text","content":"The answer is 4","timestamp":"2026-03-02T10:30:02.000Z","workspaceId":"abc-123","runId":"xyz-789"}
{"type":"result","result":{"answer":4},"timestamp":"2026-03-02T10:30:05.000Z","workspaceId":"abc-123","runId":"xyz-789"}
```

**Event Types:**

- **start**: Initial event sent by the controller with `workspaceId`, `runId`, and `timestamp`
- **All Claude CLI events**: Forwarded directly from Claude CLI's `--output-format stream-json`, with added `workspaceId`, `runId`, and `timestamp` fields
  - Common types: `thinking`, `text`, `result`, `result_success`, `tool_use`, etc.

## Workspace Management

### Configuration

The workspaces directory location can be configured via environment variable:

**Environment Variable:**
- `WORKSPACES_DIR` - Custom path for workspaces directory (optional)
- Default: `./workspaces` (relative to project root)

**Example:**
```bash
# Use custom directory
export WORKSPACES_DIR=/var/data/claude-workspaces
npm run start:dev

# Or with pm2
WORKSPACES_DIR=/var/data/claude-workspaces pm2 start "npm run start:dev" --name local-model-api
```

### Strategy

Workspaces can be created new or reused:

**New Workspace:**
- Automatically created if no `workspaceId` is provided
- Directory: `./workspaces/{workspaceId}/` where `workspaceId` is a UUID
- An initial `CLAUDE.md` file is created to reference other tracking files
- The `workspaceId` and `runId` are returned in the response

**Reusing a Workspace:**
- Provide `workspaceId` in the request body
- The workspace directory must exist (returns 400 if not)
- Allows continuity across multiple runs
- Optional `AGENTS.md` can be created via workspace creation API

### Directory Structure
```
local-model-api/
├── workspaces/
│   ├── abc-123-def-456/       # Workspace for run 1
│   │   ├── CLAUDE.md          # Reference file pointing to AGENTS.md
│   │   ├── AGENTS.md          # Optional project guidelines
│   │   └── ...                # Files created during execution
│   └── xyz-789-uvw-012/       # Workspace for run 2
│       ├── CLAUDE.md
│       ├── AGENTS.md
│       └── ...
```

**Note:** The `workspaces/` directory is gitignored.

### Workspace State Files

Each workspace contains several tracking files:

**CLAUDE.md**:
- Auto-generated file that points to AGENTS.md
- Created on first run in workspace

**AGENTS.md**:
- Optional project guidelines and context
- Created via `POST /workspaces` with `agentsMd` parameter
- Controlled by API caller, not auto-generated

## Architecture

### Module Structure

```
src/
├── main.ts                    # Bootstrap NestJS application
├── app.module.ts              # Root module (imports RunsModule, ConfigModule)
├── types.ts                   # Shared types (StreamEvent)
├── claude/
│   ├── claude.module.ts       # Claude module (exports ClaudeService)
│   └── claude.service.ts      # Claude CLI execution logic
├── workspaces/
│   ├── workspaces.controller.ts # Workspace CRUD operations
│   └── dto/
│       └── create-workspace.dto.ts # Workspace creation with optional agentsMd
└── runs/
    ├── runs.module.ts         # Runs module (exports RunsService)
    ├── runs.controller.ts     # HTTP endpoint handler
    ├── runs.service.ts        # Run execution and provider routing
    └── dto/
        └── run.dto.ts         # Request validation DTO
```

### Service Responsibilities

#### RunsService

**Purpose:** Provides reusable utilities for workspace management and JSON stream processing.

**Methods:**

1. **`ensureWorkspace(existingWorkspaceId?: string): WorkspaceContext`**
   - Creates a new workspace directory under `./workspaces/{uuid}/` if no ID provided
   - Reuses existing workspace if `existingWorkspaceId` is provided
   - Validates that existing workspace directory exists (throws 400 if not)
   - Returns `{ workspaceId, runId, workingDir }`

2. **`executeJsonStream(options): Promise<number | null>`**
   - Generic utility for executing any command that outputs newline-delimited JSON
   - Handles buffering of stdout/stderr to prevent split JSON lines
   - Parses each complete line and calls `onLine` callback
   - Returns the process exit code
   - Options:
     - `command`: Command to execute
     - `args`: Command arguments
     - `cwd`: Working directory
     - `env`: Environment variables (optional)
     - `onLine`: Callback for each parsed JSON event (optional)

**Key Features:**
- Separate buffers for stdout and stderr to prevent data corruption
- Buffers incomplete lines until newline is received
- Error handling for malformed JSON

#### ClaudeService

**Purpose:** Handles Claude CLI-specific logic.

**Methods:**

**`run(options): Promise<unknown>`**
- Creates initial `CLAUDE.md` reference file in workspace if needed
- Builds Claude CLI arguments with `--session-id` (first run) or `--resume` (subsequent runs)
- Sets permission mode (`bypassPermissions`)
- Strips `CLAUDE_CODE` and `CLAUDECODE` from environment
- Executes command and streams JSONL output
- Finds and returns the `type: "result"` or `type: "result_success"` event
- Options:
  - `prompt`: The prompt to execute (no automatic enhancement)
  - `runId`: Unique identifier for this run
  - `workingDir`: Workspace directory path
  - `outputSchema`: Optional JSON schema for structured output
  - `onOutput`: Callback for streaming events (optional)

**Command Construction:**

Example first run:
```bash
claude --session-id abc-123 -p "What is 2+2?" --output-format stream-json --verbose --permission-mode bypassPermissions
```

Example subsequent run:
```bash
claude --resume abc-123 -p "Continue the conversation" --output-format stream-json --verbose --permission-mode bypassPermissions
```

With schema:
```bash
claude --continue -p "What is 2+2?" --output-format stream-json --verbose --permission-mode bypassPermissions --json-schema '{"type":"object",...}'
```

**Note:** The `--continue` flag allows the Claude CLI to resume from previous runs in the same workspace.

#### RunsController

**Purpose:** Handles HTTP requests and orchestrates the execution flow.

**Flow:**

1. Validate request body via `RunDto` (class-validator, including optional `workspaceId`)
2. Create or reuse workspace using `RunsService.ensureWorkspace(workspaceId?)`
3. Determine streaming mode from `Accept` header
4. Set up response headers and event writer
5. Execute Claude CLI via `ClaudeService.run()` (passing `runId` for CHANGELOG tracking)
6. Stream or buffer the response
7. Handle client disconnects

## Dashboard UI

### Overview
UnoComputer includes a Next.js 16 dashboard built with Turbopack for fast development and modern UI components using shadcn/ui.

### Features
- **Runs Dashboard** - View all Claude CLI executions with real-time status updates
  - Filter by status, search by prompt
  - View detailed logs and results
  - Navigate to related sessions and workspaces

- **Sessions View** - Track conversation continuity
  - List all sessions across workspaces
  - View runs within each session
  - Continue sessions with new prompts
  - Navigate to parent workspace

- **Workspaces View** - Manage isolated environments
  - List all workspaces with metadata
  - Create workspaces with optional AGENTS.md
  - Edit workspace names
  - View workspace files (AGENTS.md)
  - Create new runs in workspace

### Navigation
- Seamless cross-navigation between runs, sessions, and workspaces
- Each list page includes quick links to related views
- Detail pages include breadcrumb navigation

### Technology Stack
- **Framework**: Next.js 16 with App Router
- **Build Tool**: Turbopack (faster than Webpack)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS with custom design tokens
- **Data Fetching**: Server-side rendering with React Server Components

### Development
```bash
# Start UI dev server
npm run dev:ui

# Build for production
npm run build:ui

# Start production server
npm run start:ui
```

The UI runs on port 3101 by default and communicates with the API on port 3100.

## Deployment

### Vercel

The project includes Vercel deployment configuration:

**Files:**
- `vercel.json` - Vercel configuration that routes all requests to `server.js`
- `api/` directory - Contains Vercel serverless functions:
  - `api/hello.ts` - Example hello endpoint
  - `api/test.ts` - Test endpoint
  - `api/index.ts` - Main API entry point
- `public/` directory - Static files:
  - `public/index.html` - Landing page

**Configuration:**
The `vercel.json` file uses `@vercel/node` builder and routes all traffic to the main server.

**Note:** The `.vercel` directory (Vercel CLI cache) is gitignored.

## Error Handling

### Validation Errors (400)

NestJS ValidationPipe automatically handles DTO validation:
```json
{
  "statusCode": 400,
  "message": ["prompt must be a string", "prompt should not be empty"],
  "error": "Bad Request"
}
```

### JSON Parsing Errors

Malformed JSON lines are logged but don't crash the process:
```
[RunsService] Failed to parse JSON: {incomplete json...
```

### Spawn Errors

If the Claude CLI fails to spawn:
```json
{
  "statusCode": 500,
  "message": "Failed to spawn claude: command not found"
}
```

## Implementation Notes

### JSON Stream Buffering

The `RunsService.executeJsonStream()` method implements robust line buffering:

1. Maintains separate buffers for stdout and stderr
2. On each data chunk:
   - Append to buffer
   - Split by `\n`
   - Pop the last element (incomplete line) back into buffer
   - Parse and emit all complete lines
3. This prevents JSON parsing errors from split chunks

### Configuration

The application uses NestJS `ConfigModule` to handle environment variables:
- Loads from `.env.local` file (gitignored) if present
- Falls back to system environment variables
- Used for `WORKSPACES_DIR` configuration

### Module Dependencies

- `RunsModule` and `ClaudeModule` have a circular dependency
- Resolved using `forwardRef()` in both module imports
- `ClaudeService` injects `RunsService` to use `executeJsonStream()`
- `RunsController` injects both `ClaudeService` and `RunsService`

### Process Management

- Client disconnects are tracked via `res.on('close', ...)`
- Stream events only written if client is still connected
- Process stdin is closed immediately after spawn to prevent hanging
