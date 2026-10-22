/**
 * Devin's print mode still writes terminal control sequences to stdout - it
 * switches bracketed paste off (`ESC[?2004l`) before answering, for one. They
 * are noise in a run's result and in its timeline, so they come out here.
 * Handles CSI sequences (ESC [ ... final byte) and OSC ones (ESC ] ... BEL/ST).
 */
/* eslint-disable no-control-regex */
const CONTROL_SEQUENCE =
  /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g;
/* eslint-enable no-control-regex */

export function stripTerminalControls(text: string): string {
  return text.replace(CONTROL_SEQUENCE, '');
}
