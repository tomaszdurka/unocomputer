import { turnOutcome } from './outcome';

describe('turnOutcome', () => {
  it('is an answer when the CLI says nothing went wrong', () => {
    expect(
      turnOutcome({
        type: 'result',
        result: 'done',
        structured_output: { ok: true },
      }),
    ).toEqual({ kind: 'answered' });
    expect(
      turnOutcome({ type: 'result', is_error: false, result: 'done' }),
    ).toEqual({ kind: 'answered' });
  });

  it("is interrupted when the API could not be reached, in the CLI's words", () => {
    const message =
      "API Error: Can't reach the API server - check your internet or DNS (ENOTFOUND)";
    expect(
      turnOutcome({
        type: 'result',
        is_error: true,
        terminal_reason: 'api_error',
        result: message,
      }),
    ).toEqual({
      kind: 'interrupted',
      message,
    });
    // An older CLI without the reason still says so in the text.
    expect(
      turnOutcome({ type: 'result', is_error: true, result: message }),
    ).toEqual({ kind: 'interrupted', message });
  });

  it('is failed for any other error the CLI ends with', () => {
    expect(
      turnOutcome({
        type: 'result',
        is_error: true,
        terminal_reason: 'max_turns',
        result: 'ran out of turns',
      }),
    ).toEqual({
      kind: 'failed',
      message: 'ran out of turns',
    });
    expect(turnOutcome({ type: 'result', is_error: true })).toEqual({
      kind: 'failed',
      message: 'the CLI ended the turn with an error',
    });
  });
});
