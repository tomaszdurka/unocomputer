import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { which } from './which';

describe('which', () => {
  let a: string;
  let b: string;

  beforeEach(() => {
    a = fs.mkdtempSync(path.join(os.tmpdir(), 'which-a-'));
    b = fs.mkdtempSync(path.join(os.tmpdir(), 'which-b-'));
  });

  afterEach(() => {
    fs.rmSync(a, { recursive: true, force: true });
    fs.rmSync(b, { recursive: true, force: true });
  });

  const executable = (dir: string, name: string) => {
    const file = path.join(dir, name);
    fs.writeFileSync(file, '#!/bin/sh\n');
    fs.chmodSync(file, 0o755);
    return file;
  };

  it('finds an executable on PATH and reports where', () => {
    const file = executable(b, 'claude');
    expect(which('claude', { PATH: `${a}${path.delimiter}${b}` })).toBe(file);
  });

  it('answers null when nothing on PATH has that name', () => {
    expect(which('devin', { PATH: `${a}${path.delimiter}${b}` })).toBeNull();
  });

  it('prefers the first PATH entry, like a shell', () => {
    const first = executable(a, 'codex');
    executable(b, 'codex');
    expect(which('codex', { PATH: `${a}${path.delimiter}${b}` })).toBe(first);
  });

  it('skips a file that is not executable', () => {
    fs.writeFileSync(path.join(a, 'gemini'), 'not a program');
    expect(which('gemini', { PATH: a })).toBeNull();
  });

  it('skips a directory that happens to carry the name', () => {
    fs.mkdirSync(path.join(a, 'claude'));
    expect(which('claude', { PATH: a })).toBeNull();
  });

  it('refuses a path rather than a bare name', () => {
    executable(a, 'claude');
    expect(which(path.join(a, 'claude'), { PATH: a })).toBeNull();
  });

  it('copes with an empty or missing PATH', () => {
    expect(which('claude', { PATH: '' })).toBeNull();
    expect(which('claude', {})).toBeNull();
  });
});
