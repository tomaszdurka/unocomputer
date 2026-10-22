import { stripTerminalControls } from './terminal-controls';

describe('stripTerminalControls', () => {
  it('removes the bracketed-paste switch devin prints before an answer', () => {
    expect(stripTerminalControls('\x1b[?2004lOK')).toBe('OK');
    expect(stripTerminalControls('\x1b[?2004l')).toBe('');
  });

  it('removes colour and cursor sequences but keeps the text', () => {
    expect(stripTerminalControls('\x1b[1;32mdone\x1b[0m in 2s')).toBe(
      'done in 2s',
    );
    expect(stripTerminalControls('a\x1b[2Kb\x1b[1Gc')).toBe('abc');
  });

  it('removes an OSC title sequence', () => {
    expect(stripTerminalControls('\x1b]0;devin\x07answer')).toBe('answer');
  });

  it('leaves ordinary text, newlines and brackets alone', () => {
    const text = 'result: [1, 2]\nline two';
    expect(stripTerminalControls(text)).toBe(text);
  });
});
