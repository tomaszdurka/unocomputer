import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { defaultWorkspaceDir, resolveCallerDirectory } from './workspace-directory';

describe('defaultWorkspaceDir', () => {
  it('nests the workspace under WORKSPACES_DIR', () => {
    expect(defaultWorkspaceDir('w1', { WORKSPACES_DIR: '/data/ws' })).toBe('/data/ws/w1');
  });

  it('falls back to ./workspaces beside the backend', () => {
    expect(defaultWorkspaceDir('w1', {})).toBe(path.join(process.cwd(), 'workspaces', 'w1'));
  });
});

describe('resolveCallerDirectory', () => {
  let root: string;

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'uno-dir-'));
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('rejects a relative path', () => {
    expect(() => resolveCallerDirectory('projects/app')).toThrow(BadRequestException);
  });

  it('rejects a folder that does not exist', () => {
    expect(() => resolveCallerDirectory(path.join(root, 'missing'))).toThrow(
      /does not exist/,
    );
  });

  it('rejects a file', () => {
    const file = path.join(root, 'notes.txt');
    fs.writeFileSync(file, 'x');
    expect(() => resolveCallerDirectory(file)).toThrow(/not a directory/);
  });

  it('returns the canonical path of an existing folder', () => {
    const dir = path.join(root, 'app');
    fs.mkdirSync(dir);
    const link = path.join(root, 'link');
    fs.symlinkSync(dir, link);

    expect(resolveCallerDirectory(link)).toBe(fs.realpathSync.native(dir));
    expect(resolveCallerDirectory(dir + path.sep)).toBe(fs.realpathSync.native(dir));
  });
});
