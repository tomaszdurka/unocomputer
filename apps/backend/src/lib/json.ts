// The model CLIs emit newline-delimited JSON whose shape varies by tool and version, so
// there is no honest concrete type for a line. These say "arbitrary JSON" precisely,
// which is both true and checkable - unlike `any`, which also disables checking of
// everything downstream of it.

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

/** One line of a CLI's stream-json output. `type` is the only field every tool sets. */
export type CliEvent = JsonObject & { type?: string };
