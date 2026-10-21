import { Run, Session, Workspace } from '../../database/types';
import { CliEvent, JsonValue } from '../../lib/json';

export type RunOptions = {
  run: Run;
  session: Session;
  workspace: Workspace;
  /** Model to pin on the CLI, parsed from the run's "<provider>:<model>". */
  cliModel?: string;
  /** Extra environment for the CLI, over the service's own. */
  env?: Record<string, string>;
  onOutput?: (line: CliEvent) => void;
};

export type RunResult = {
  result: string;
  structuredResult?: JsonValue;
  /**
   * Set when the turn ended without an answer for a reason outside it, in
   * the CLI's words - the API unreachable, say. The run is `interrupted`;
   * the session is intact and the next run in it picks up where it stopped.
   */
  interrupted?: string;
  /** Set when the CLI ended the turn with an error of its own. The run is `failure`. */
  error?: string;
};
