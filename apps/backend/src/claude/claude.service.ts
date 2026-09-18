import {Injectable, Logger} from '@nestjs/common';
import { CliEvent } from '../lib/json';
import * as fs from "node:fs";
import { Run } from '../database/types';
import {executeCommandWithJsonStreamOutput} from "../lib/executeCommandWithJsonStreamOutput";
import {RunOptions, RunResult} from "../runs/dto/run-options";


@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);

  async run(options: RunOptions): Promise<RunResult> {
    const {run, session, workspace, cliModel} = options;
    const {runId, prompt, outputSchema} = run;


    // Check if this is the first run in the session (no completed runs yet)
    const sessionRuns = session.runs ?? [];
    const isFirstRun = sessionRuns.filter((r: Run) => r.runId !== runId).length === 0;

    const permissionMode = 'bypassPermissions';
    const args = [];

    // First run: create session with --session-id
    // Subsequent runs: continue session with --resume
    if (isFirstRun) {
      args.push('--session-id', session.sessionId);
    } else {
      args.push('--resume', session.sessionId);
    }

    args.push(
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--permission-mode',
      permissionMode,
    );

    // Pin the model when the run asked for one (e.g. "claude:sonnet");
    // otherwise the CLI default applies.
    if (cliModel) {
      args.push('--model', cliModel);
    }

    // MCP servers (e.g. Playwright/Chrome for sites that need a real browser).
    // MCP_CONFIG points at a JSON file; runs get the tools with no prompt
    // because the session already runs with bypassPermissions.
    const mcpConfig = process.env.MCP_CONFIG;
    if (mcpConfig && fs.existsSync(mcpConfig)) {
      args.push('--mcp-config', mcpConfig);
    } else if (mcpConfig) {
      this.logger.warn(`MCP_CONFIG set but missing: ${mcpConfig}`);
    }

    // Add schema if provided
    if (outputSchema) {
      args.push('--json-schema', JSON.stringify(outputSchema));
    }

    // Strip Claude environment variables to avoid nesting issues
    const env = { ...process.env };
    delete env.CLAUDE_CODE;
    delete env.CLAUDECODE;

    this.logger.log(`claude ${args.join(' ')}`);

    let result: RunResult | null = null;

    await executeCommandWithJsonStreamOutput({
      command: 'claude',
      args,
      cwd: workspace.workingDir,
      env,
      onLine: (event: CliEvent) => {
        if (event.type === 'result' || event.type === 'result_success') {
          result = {
            result: typeof event.result === 'string' ? event.result : JSON.stringify(event.result ?? null),
            ...(event.structured_output !== undefined
              ? { structuredResult: event.structured_output }
              : {}),
          };
        }
        options.onOutput?.(event);
      },
    });

    if (!result) {
      throw new Error('claude exited without emitting a result event');
    }
    return result;
  }
}
