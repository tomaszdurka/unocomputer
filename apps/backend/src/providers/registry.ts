/**
 * The CLIs UnoComputer can drive. One entry per provider; the id is what a run's
 * `model` names before the optional ":<model>" suffix, and the binary is what
 * has to be on PATH for the provider to count as available.
 *
 * This is the single source of truth: the admin's model picker, the settings
 * page and run validation all read it through ProvidersService.
 */
export type ProviderDefinition = {
  id: string;
  label: string;
  binary: string;
  /** Whether "<id>:<model>" pins the CLI's model (passed as its --model flag). */
  pinnable: boolean;
  /** Suggested models for the picker. Not a whitelist: the CLI decides what it accepts. */
  models: string[];
};

export const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: 'claude',
    label: 'Claude Code',
    binary: 'claude',
    pinnable: true,
    models: ['sonnet', 'haiku', 'opus', 'fable'],
  },
  {
    id: 'codex',
    label: 'Codex',
    binary: 'codex',
    pinnable: false,
    models: [],
  },
  {
    id: 'gemini',
    label: 'Gemini CLI',
    binary: 'gemini',
    pinnable: false,
    models: [],
  },
  {
    id: 'devin',
    label: 'Devin',
    binary: 'devin',
    pinnable: true,
    // Short names resolve to the latest in the family, per Devin's docs.
    models: ['opus', 'sonnet', 'swe', 'codex', 'gemini'],
  },
];

export function findProvider(id: string): ProviderDefinition | undefined {
  return PROVIDERS.find((provider) => provider.id === id);
}

/** Splits "<provider>[:<model>]" the way RunsService always has. */
export function parseModel(model: string): {
  providerId: string;
  cliModel?: string;
} {
  const separator = model.indexOf(':');
  return separator === -1
    ? { providerId: model }
    : {
        providerId: model.slice(0, separator),
        cliModel: model.slice(separator + 1),
      };
}
