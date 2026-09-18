/**
 * The folder already belongs to another workspace. Raised by persistence so the
 * controller can answer 409 without persistence knowing about HTTP.
 */
export class WorkspaceDirectoryTakenError extends Error {
  constructor(readonly workingDir: string) {
    super(`A workspace already exists for ${workingDir}`);
    this.name = 'WorkspaceDirectoryTakenError';
  }
}
