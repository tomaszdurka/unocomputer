import { CliEvent } from '../lib/json';

/**
 * How a Claude CLI turn ended, read off its final `result` event. The CLI
 * says `is_error` when the turn did not end with an answer, and
 * `terminal_reason` says why. An API that could not be reached is the one
 * case that is nobody's fault and passes: the turn is interrupted, not
 * failed, and the session resumes where it stopped.
 */
export type TurnOutcome =
  | { kind: 'answered' }
  | { kind: 'interrupted'; message: string }
  | { kind: 'failed'; message: string };

const INTERRUPTING_REASONS = new Set(['api_error', 'rate_limit', 'overloaded']);

export function turnOutcome(event: CliEvent): TurnOutcome {
  if (event.is_error !== true) return { kind: 'answered' };
  const message =
    typeof event.result === 'string' && event.result
      ? event.result
      : 'the CLI ended the turn with an error';
  const reason =
    typeof event.terminal_reason === 'string' ? event.terminal_reason : '';
  if (INTERRUPTING_REASONS.has(reason) || /^API Error/i.test(message))
    return { kind: 'interrupted', message };
  return { kind: 'failed', message };
}
