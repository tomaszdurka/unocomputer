import { Injectable, Logger } from '@nestjs/common';
import { execFile } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import type { Session, Workspace } from '../database/types';
import { executeCommandWithTextOutput } from '../lib/executeCommandWithTextOutput';
import { providerSessionDir } from '../lib/session-storage';
import type { RunOptions, RunResult } from '../runs/dto/run-options';
import { findDevinSessionId } from './session-list';
import { stripTerminalControls } from './terminal-controls';

const execFileAsync = promisify(execFile);

/**
 * Devin's CLI in print mode: `devin -p` runs one turn and exits, printing the
 * answer as plain text. There is no stream-json, so the timeline gets one
 * `text` event per line instead of tool events.
 *
 * Continuity: Devin names its own sessions, and only `devin list` in the
 * session's folder says what they are. The first run plants a marker in the
 * prompt, the listing is read afterwards to learn the id, and later runs pass
 * it to --resume. The id lives in Uno's session dir, as codex's and gemini's
 * do.
 */
@Injectable()
export class DevinService {
  private readonly logger = new Logger(DevinService.name);

  async run(options: RunOptions): Promise<RunResult> {
    const { run, session, workspace, cliModel } = options;
    const { prompt, outputSchema } = run;

    const devinSessionId = this.retrieveDevinSessionId(session, workspace);
    const sessionMarker = devinSessionId
      ? ''
      : `[SESSION-ID=${session.sessionId}]\n`;
    let enhancedPrompt = `${sessionMarker}${prompt}`;
    if (outputSchema) {
      enhancedPrompt +=
        `\n\nIMPORTANT: Wrap result in <STRUCTURED>...</STRUCTURED> as structured ` +
        `output using following JSON schema: ${JSON.stringify(outputSchema)}`;
    }

    // Unattended like the other CLIs. Print mode cannot show the workspace trust
    // prompt and fails in an untrusted folder - which every Uno workspace is -
    // unless told to skip the check.
    const args = [
      '--permission-mode',
      'dangerous',
      '--respect-workspace-trust',
      'false',
    ];
    if (devinSessionId) args.push('--resume', devinSessionId);
    if (cliModel) args.push('--model', cliModel);
    args.push('--print', '--', enhancedPrompt);

    const env = { ...process.env, ...options.env };
    this.logger.log(`devin ${args.slice(0, -1).join(' ')} <prompt>`);

    const { code, stdout, stderr } = await executeCommandWithTextOutput({
      command: 'devin',
      args,
      cwd: workspace.workingDir,
      env,
      onLine: (event) => {
        const content =
          typeof event.content === 'string'
            ? stripTerminalControls(event.content)
            : event.content;
        // A line that was only a control sequence is nothing to show.
        if (typeof content === 'string' && !content.trim()) return;
        options.onOutput?.({ ...event, content });
      },
    });

    if (!devinSessionId) {
      await this.extractDevinSessionId(session, workspace, env);
    }

    const result = stripTerminalControls(stdout).trim();
    if (code !== 0) {
      const detail =
        stripTerminalControls(stderr).trim() ||
        result ||
        `devin exited with code ${code}`;
      return { result: detail, error: detail };
    }

    let structuredResult;
    if (outputSchema) {
      const match = result.match(/<STRUCTURED>([\s\S]*?)<\/STRUCTURED>/);
      if (match) {
        try {
          structuredResult = JSON.parse(match[1]);
        } catch {
          // The model wrapped something that is not JSON; the text answer stands.
        }
      }
    }
    return { result, structuredResult };
  }

  private sessionIdFile(session: Session, workspace: Workspace): string {
    return path.join(
      providerSessionDir('devin', session, workspace),
      'session-id',
    );
  }

  retrieveDevinSessionId(
    session: Session,
    workspace: Workspace,
  ): string | null {
    const file = this.sessionIdFile(session, workspace);
    return fs.existsSync(file)
      ? fs.readFileSync(file, 'utf8').trim() || null
      : null;
  }

  /** Reads `devin list` in the workspace folder to learn which session the run made. */
  private async extractDevinSessionId(
    session: Session,
    workspace: Workspace,
    env: NodeJS.ProcessEnv,
  ): Promise<void> {
    try {
      const { stdout } = await execFileAsync(
        'devin',
        ['list', '--format', 'json'],
        {
          cwd: workspace.workingDir,
          env,
        },
      );
      const id = findDevinSessionId(
        JSON.parse(stdout),
        session.sessionId,
        workspace.workingDir,
      );
      if (id) {
        fs.writeFileSync(this.sessionIdFile(session, workspace), id);
      } else {
        this.logger.warn(
          `No devin session found for ${session.sessionId}; the next run starts fresh`,
        );
      }
    } catch (error) {
      // Best effort: without an id the next run simply cannot resume.
      this.logger.warn(
        `Could not read devin's session list: ${(error as Error).message}`,
      );
    }
  }
}
