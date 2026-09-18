import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { providerSessionDir, sessionsDir } from './session-storage';

describe('sessionsDir', () => {
  it('honours SESSIONS_DIR', () => {
    expect(sessionsDir({ SESSIONS_DIR: '/data/sessions' })).toBe('/data/sessions');
  });

  it('defaults to data/sessions beside the database', () => {
    expect(sessionsDir({})).toBe(path.resolve(process.cwd(), '../../data/sessions'));
  });
});

describe('providerSessionDir', () => {
  let root: string;
  let workspaceDir: string;
  let store: string;
  const session = { sessionId: 's1' };

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'uno-sessions-'));
    workspaceDir = path.join(root, 'workspace');
    store = path.join(root, 'store');
    fs.mkdirSync(workspaceDir);
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('creates the folder under the store, not the workspace', () => {
    const dir = providerSessionDir('codex', session, { workingDir: workspaceDir }, store);

    expect(dir).toBe(path.join(store, 'codex', 's1'));
    expect(fs.statSync(dir).isDirectory()).toBe(true);
    expect(fs.readdirSync(workspaceDir)).toEqual([]);
  });

  it('moves a legacy folder out of the workspace, keeping its contents', () => {
    const legacy = path.join(workspaceDir, '.codex', 's1');
    fs.mkdirSync(legacy, { recursive: true });
    fs.writeFileSync(path.join(legacy, 'session-id'), 'codex-123');

    const dir = providerSessionDir('codex', session, { workingDir: workspaceDir }, store);

    expect(fs.readFileSync(path.join(dir, 'session-id'), 'utf-8')).toBe('codex-123');
    expect(fs.existsSync(path.join(workspaceDir, '.codex'))).toBe(false);
  });

  it('leaves the legacy parent while other sessions still live there', () => {
    fs.mkdirSync(path.join(workspaceDir, '.gemini', 's1'), { recursive: true });
    fs.mkdirSync(path.join(workspaceDir, '.gemini', 's2'), { recursive: true });

    providerSessionDir('gemini', session, { workingDir: workspaceDir }, store);

    expect(fs.existsSync(path.join(workspaceDir, '.gemini', 's2'))).toBe(true);
    expect(fs.existsSync(path.join(workspaceDir, '.gemini', 's1'))).toBe(false);
  });

  it('is a no-op once the folder is in the store', () => {
    const first = providerSessionDir('codex', session, { workingDir: workspaceDir }, store);
    fs.writeFileSync(path.join(first, 'session-id'), 'kept');

    const second = providerSessionDir('codex', session, { workingDir: workspaceDir }, store);

    expect(second).toBe(first);
    expect(fs.readFileSync(path.join(second, 'session-id'), 'utf-8')).toBe('kept');
  });
});
