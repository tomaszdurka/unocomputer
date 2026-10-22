import { Injectable, Logger } from '@nestjs/common';
import { CliEvent } from '../lib/json';
import { PersistenceService } from '../database/persistence.service';
import { RunStatus } from '../database/types';
import { RunOptions, RunResult } from './dto/run-options';
import { ClaudeService } from '../claude/claude.service';
import { GeminiService } from '../gemini/gemini.service';
import { CodexService } from '../codex/codex.service';
import { DevinService } from '../devin/devin.service';
import { ProvidersService } from '../providers/providers.service';

@Injectable()
export class RunsService {
  constructor(
    private readonly persistence: PersistenceService,
    private readonly claudeService: ClaudeService,
    private readonly geminiService: GeminiService,
    private readonly codexService: CodexService,
    private readonly devinService: DevinService,
    private readonly providers: ProvidersService,
  ) {}
  private readonly logger = new Logger(RunsService.name);

  // The model is "<provider>" or "<provider>:<model>" - e.g. "claude",
  // "claude:sonnet", "claude:sonnet-4-5" - so a run can pin the CLI's model
  // instead of inheriting its default.
  async runProvider(model: string, options: RunOptions) {
    const separator = model.indexOf(':');
    const provider = separator === -1 ? model : model.slice(0, separator);
    const cliModel = separator === -1 ? undefined : model.slice(separator + 1);
    if (provider === 'claude') {
      return this.claudeService.run({ ...options, cliModel });
    }
    if (provider === 'gemini') {
      return this.geminiService.run(options);
    }
    if (provider === 'codex') {
      return this.codexService.run(options);
    }
    if (provider === 'devin') {
      return this.devinService.run({ ...options, cliModel });
    }
    throw new Error('Invalid provider');
  }

  async run(options: RunOptions): Promise<RunResult> {
    const { run, session, workspace } = options;
    const { runId } = run;

    let prompt = run.prompt;
    let model = run.model;

    const sessionRuns = session.runs ?? [];
    if (sessionRuns.length > 0) {
      const lastRun = sessionRuns[sessionRuns.length - 1];
      const lastModel = lastRun.model;
      if (!model) {
        model = lastModel;
      }
      if (model !== lastModel) {
        prompt =
          `IMPORTANT: The model has been switched from ${lastModel} to ${model}. Be aware that external changes may have occurred since the last run. Review the workspace state carefully before proceeding.\n\n` +
          prompt;
      }
    }

    // Runs created since the providers settings exist carry their resolved
    // model; this is for rows that predate it.
    if (!model) {
      model = await this.providers.defaultModel();
    }

    let sequence = 0;
    const result = await this.runProvider(model, {
      run: { ...run, prompt },
      session,
      workspace,
      env: options.env,
      onOutput: (event: CliEvent) => {
        sequence++;
        options.onOutput?.(event);
        this.persistence.storeEvent({
          runId,
          event,
          sequence,
        });
      },
    });

    // The status says how the turn ended: answered, interrupted by something
    // outside it, or failed by the CLI itself. Not the exit code, which is 0
    // for all three.
    await this.persistence.setStatus({
      runId,
      result,
      exitCode: 0,
      status: result.interrupted
        ? RunStatus.INTERRUPTED
        : result.error
          ? RunStatus.FAILURE
          : RunStatus.SUCCESS,
    });

    return result;
  }
}
