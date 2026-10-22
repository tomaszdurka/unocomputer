import { Injectable } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { findProvider, parseModel, PROVIDERS } from './registry';
import { which } from './which';

/** A provider as the API presents it: the registry entry plus its live state. */
export type ProviderStatus = {
  id: string;
  label: string;
  binary: string;
  pinnable: boolean;
  models: string[];
  /** The binary is on PATH. */
  available: boolean;
  /** Where it was found, when it was. */
  path: string | null;
  /** Not switched off in settings. */
  enabled: boolean;
};

/**
 * A run cannot have this model. The message is written for the person who
 * sent the request; controllers surface it as a 400.
 */
export class ProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

@Injectable()
export class ProvidersService {
  constructor(private readonly settings: SettingsService) {}

  async list(): Promise<ProviderStatus[]> {
    return Promise.all(
      PROVIDERS.map(async (provider) => {
        const path = which(provider.binary);
        return {
          ...provider,
          models: [...provider.models],
          available: path !== null,
          path,
          enabled: await this.settings.isProviderEnabled(provider.id),
        };
      }),
    );
  }

  async get(id: string): Promise<ProviderStatus | null> {
    return (await this.list()).find((provider) => provider.id === id) ?? null;
  }

  /**
   * The model to fall back on. Unset in settings means the first provider in
   * the registry, which is what the hardcoded default always was.
   */
  async defaultModel(): Promise<string> {
    return (await this.settings.getDefaultModel()) ?? PROVIDERS[0].id;
  }

  /**
   * The model a run will actually use, or why it cannot: the request's choice,
   * else the session's last, else the default. Checked here, before a run row
   * exists, so a disabled or missing CLI is a 400 at submit rather than a run
   * that dies on spawn.
   */
  async resolveModel(
    requested: string | null | undefined,
    inherited: string | null | undefined,
  ): Promise<{ model: string; providerId: string; cliModel?: string }> {
    const model = requested ?? inherited ?? (await this.defaultModel());
    const { providerId, cliModel } = parseModel(model);
    const definition = findProvider(providerId);
    if (!definition) {
      throw new ProviderError(
        `unknown provider "${providerId}" in model "${model}"; known: ${PROVIDERS.map((p) => p.id).join(', ')}`,
      );
    }
    if (cliModel !== undefined && !definition.pinnable) {
      throw new ProviderError(
        `${providerId} does not take a model suffix; use "${providerId}"`,
      );
    }
    if (!(await this.settings.isProviderEnabled(providerId))) {
      throw new ProviderError(`${definition.label} is disabled in settings`);
    }
    if (which(definition.binary) === null) {
      throw new ProviderError(
        `${definition.label} is not installed: no "${definition.binary}" on PATH`,
      );
    }
    return { model, providerId, cliModel };
  }

  /**
   * The default has to name a provider that exists and is enabled; it does not
   * have to be installed yet, so a machine can be configured before its CLIs.
   */
  async setDefaultModel(model: string): Promise<void> {
    const { providerId, cliModel } = parseModel(model);
    const definition = findProvider(providerId);
    if (!definition) {
      throw new ProviderError(
        `unknown provider "${providerId}"; known: ${PROVIDERS.map((p) => p.id).join(', ')}`,
      );
    }
    if (cliModel !== undefined && !definition.pinnable) {
      throw new ProviderError(
        `${providerId} does not take a model suffix; use "${providerId}"`,
      );
    }
    if (!(await this.settings.isProviderEnabled(providerId))) {
      throw new ProviderError(
        `${definition.label} is disabled; enable it before making it the default`,
      );
    }
    await this.settings.setDefaultModel(model);
  }

  /** Switching off the default model's provider would strand every unqualified run. */
  async setEnabled(id: string, enabled: boolean): Promise<ProviderStatus> {
    const definition = findProvider(id);
    if (!definition) {
      throw new ProviderError(`unknown provider "${id}"`);
    }
    if (!enabled) {
      const { providerId } = parseModel(await this.defaultModel());
      if (providerId === id) {
        throw new ProviderError(
          `${definition.label} provides the default model; choose another default first`,
        );
      }
    }
    await this.settings.setProviderEnabled(id, enabled);
    return (await this.get(id))!;
  }
}
