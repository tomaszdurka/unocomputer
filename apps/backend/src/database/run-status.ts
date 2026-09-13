// Run status lived on the MikroORM entity as an @Enum. Prisma models are plain types
// and SQLite has no enum, so the values live here and the column carries a CHECK
// constraint. Anything importing RunStatus from the old entities barrel gets it here.
export enum RunStatus {
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILURE = 'failure',
  STOPPED = 'stopped',
}

export const RUN_STATUSES = Object.values(RunStatus);
