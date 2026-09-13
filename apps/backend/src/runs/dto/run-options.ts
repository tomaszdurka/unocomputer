import {Run, Session, Workspace} from '../../database/types';
import { CliEvent, JsonValue } from '../../lib/json';

export type RunOptions = {
    run: Run;
    session: Session;
    workspace: Workspace
    onOutput?: (line: CliEvent) => void;
}

export type RunResult = {
    result: string;
    structuredResult?: JsonValue
}