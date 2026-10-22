import { spawn } from 'node:child_process';
import type { CliEvent } from './json';

/**
 * For a CLI that prints plain text rather than stream-json. Each stdout line
 * becomes a `text` event and each stderr line a `stderr` event, so the run's
 * timeline shows the tool talking even though the tool has no event stream
 * of its own; the whole stdout comes back as the answer.
 */
export async function executeCommandWithTextOutput(options: {
  command: string;
  args: string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  onLine?: (event: CliEvent) => void;
}): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(options.command, options.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd,
      env: options.env ?? process.env,
    });

    let stdout = '';
    let stderr = '';
    let stdoutPending = '';
    let stderrPending = '';

    const emitLines = (type: string, pending: string, chunk: string) => {
      const lines = (pending + chunk).split('\n');
      const rest = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) options.onLine?.({ type, content: line });
      }
      return rest;
    };

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn ${options.command}: ${err.message}`));
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      stdoutPending = emitLines('text', stdoutPending, text);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      stderrPending = emitLines('stderr', stderrPending, text);
    });
    child.on('close', (code) => {
      if (stdoutPending.trim())
        options.onLine?.({ type: 'text', content: stdoutPending });
      if (stderrPending.trim())
        options.onLine?.({ type: 'stderr', content: stderrPending });
      resolve({ code, stdout, stderr });
    });
    child.stdin?.end();
  });
}
