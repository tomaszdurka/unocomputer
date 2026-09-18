import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Where a managed workspace lives: its own UUID folder under WORKSPACES_DIR (or
 * ./workspaces beside the backend when unset). The caller creates the folder.
 */
export function defaultWorkspaceDir(
  workspaceId: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const root = env.WORKSPACES_DIR ?? path.join(process.cwd(), 'workspaces');
  return path.join(root, workspaceId);
}

/**
 * A folder the caller chose for a workspace. It has to exist already - a
 * workspace on a caller's folder is a binding, never a creation - and it comes
 * back canonical (symlinks and case resolved), so two spellings of one folder
 * meet the unique constraint as the same folder.
 */
export function resolveCallerDirectory(input: string): string {
  if (!path.isAbsolute(input)) {
    throw new BadRequestException(`directory must be an absolute path, got "${input}"`);
  }
  let stat: fs.Stats;
  try {
    stat = fs.statSync(input);
  } catch {
    throw new BadRequestException(`directory does not exist: ${input}`);
  }
  if (!stat.isDirectory()) {
    throw new BadRequestException(`directory is not a directory: ${input}`);
  }
  return fs.realpathSync.native(input);
}
