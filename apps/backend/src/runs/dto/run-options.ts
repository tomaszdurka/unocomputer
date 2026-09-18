import {Run, Session, Workspace} from '../../database/types';
import { CliEvent, JsonValue } from '../../lib/json';

export type RunOptions = {
    run: Run;
    session: Session;
    workspace: Workspace
    /** Model to pin on the CLI, parsed from the run's "<provider>:<model>". */
    cliModel?: string;
    /** Extra environment for the CLI, over the service's own. */
    env?: Record<string, string>;
    onOutput?: (line: CliEvent) => void;
}

export type RunResult = {
    result: string;
    structuredResult?: JsonValue
}