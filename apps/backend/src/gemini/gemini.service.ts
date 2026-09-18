import {Injectable, Logger} from '@nestjs/common';
import { CliEvent } from '../lib/json';
import path from "node:path";
import * as fs from "node:fs";
import { Session, Workspace } from '../database/types';
import {executeCommandWithJsonStreamOutput} from "../lib/executeCommandWithJsonStreamOutput";
import {RunOptions, RunResult} from "../runs/dto/run-options";
import {readFileSync} from "fs";
import {execSync} from "node:child_process";
import {providerSessionDir} from '../lib/session-storage';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  async run(options: RunOptions): Promise<RunResult> {
    const {run, session, workspace} = options;
    const {runId, prompt, outputSchema} = run;

    // Ensure run directory exist
    const runPath = path.join(this.getSessionDirectory(session, workspace), runId);
    fs.mkdirSync(runPath, {recursive: true});

    // Check for existing codex session
    const geminiSessionId = this.retrieveGeminiSessionId(session, workspace);
    const sessionMarker = geminiSessionId ? '' : `[SESSION-ID=${session.sessionId}]\n`
    let enhancedPrompt = `${sessionMarker}${prompt}`

    if (outputSchema) {
      enhancedPrompt = `${enhancedPrompt}\n\nIMPORTANT: Wrap result in <STRUCTURED>...</STRUCTURED> as structured output using following JSON schema: ${JSON.stringify(outputSchema)}`
    }

    const args = [];

    if (geminiSessionId) {
      args.push(
          '--resume',
          geminiSessionId,
      )
    }

    args.push(
      '--prompt',
        enhancedPrompt,
      '--output-format',
      'stream-json',
      '--yolo',
    );

    // Add schema if provided
    if (outputSchema) {
      // args.push('--response-schema', JSON.stringify(outputSchema));
    }
    // Strip environment variables to avoid nesting issues
    const env = { ...process.env, ...options.env };
    this.logger.log(`gemini ${args.join(' ')}`);

    const assistantMessages: string[] = []
    let assistantMessageBuffer = ''
    await executeCommandWithJsonStreamOutput({
      command: 'gemini',
      args,
      cwd: workspace.workingDir,
      env,
      onLine: (event: CliEvent) => {
        if (event.type === 'message' && event.role === 'assistant') {
          assistantMessageBuffer += event.content;
        }
        if (assistantMessageBuffer && !event.delta) {
          assistantMessages.push(assistantMessageBuffer);
          assistantMessageBuffer = '';
        }

        options.onOutput?.(event);
      },
    });
    this.extractGeminiSessionId(session, workspace);

    const result = assistantMessages[assistantMessages.length - 1];
    let structuredResult;
    if (outputSchema) {
      const lastMatch = result.match(/.*<STRUCTURED>([\s\S]*?)<\/STRUCTURED>/s);
      if (lastMatch) {
        const resultString = lastMatch[1];
        try {
          structuredResult = JSON.parse(resultString);
        } catch {
      // Best effort: a missing or malformed session file just means no id to resume.
    }
      }
    }

    return {
      result,
      structuredResult,
    };
  }

  retrieveGeminiSessionId(session: Session, workspace: Workspace) {
    const sessionPath = this.getSessionDirectory(session, workspace);

    // Find gemini session id, but searching for special file
    const geminiSessionPath = path.join(sessionPath, 'session-id');
    if (fs.existsSync(geminiSessionPath)) {
      return readFileSync(geminiSessionPath).toString()
    }
    return null;
  }

  extractGeminiSessionId(session: Session, workspace: Workspace) {
    const sessionPath = this.getSessionDirectory(session, workspace);
    const geminiSessionPath = path.join(sessionPath, 'session-id');

    // Find gemini session id, but searching for special session-marker
    try {
      const cmd = `find ~/.gemini/tmp -name "*.json" -exec grep -lF "[SESSION-ID=${session.sessionId}]" {} + | xargs grep -m 1 "sessionId" | sed -E 's/.*"sessionId":[[:space:]]*"([^"]+)".*/\\1/' | head -n 1`;
      const geminiSessionId = execSync(cmd, {encoding: 'utf8'}).trim();
      if (geminiSessionId) {
        fs.writeFileSync(geminiSessionPath, geminiSessionId);
        return geminiSessionId;
      }
    } catch {
      // Best effort: a missing or malformed session file just means no id to resume.
    }
    return null;
  }

  // Uno's own state about the session, kept out of the workspace folder.
  getSessionDirectory(session: Session, workspace: Workspace) {
    return providerSessionDir('gemini', session, workspace);
  }

}
