// Run status lived on the MikroORM entity as an @Enum. Prisma models are plain types
// and SQLite has no enum, so the values live here and the column carries a CHECK
// constraint. Anything importing RunStatus from the old entities barrel gets it here.
export enum RunStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  STOPPED = 'stopped',
  /**
   * The CLI ended the turn without an answer for a reason outside it - the
   * API unreachable, a rate limit - after its own retries. The session is
   * intact: the next run in it picks up where this one stopped.
   */
  INTERRUPTED = 'interrupted',
}

export const RUN_STATUSES = Object.values(RunStatus);
