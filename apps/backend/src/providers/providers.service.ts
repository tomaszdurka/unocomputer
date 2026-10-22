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
   * The ordered preferences for a run that names no model: what is stored,
   * padded with every provider not yet listed in registry order, so a
   * freshly added provider is reachable without anyone editing the list.
   */
  async modelPreferences(): Promise<string[]> {
    const stored = (await this.settings.getModelPreferences()) ?? [];
    const listed = new Set(stored.map((model) => parseModel(model).providerId));
    const rest = PROVIDERS.filter((p) => !listed.has(p.id)).map((p) => p.id);
    return [...stored, ...rest];
  }

  /**
   * The first preference whose provider is enabled and installed, or null
   * when none is - with, for each one passed over, why.
   */
  async effectiveModel(): Promise<{
    model: string | null;
    skipped: { model: string; reason: string }[];
  }> {
    const skipped: { model: string; reason: string }[] = [];
    for (const model of await this.modelPreferences()) {
      const { providerId } = parseModel(model);
      const definition = findProvider(providerId);
      if (!definition) {
        skipped.push({ model, reason: 'unknown provider' });
        continue;
      }
      if (!(await this.settings.isProviderEnabled(providerId))) {
        skipped.push({ model, reason: 'disabled' });
        continue;
      }
      if (which(definition.binary) === null) {
        skipped.push({ model, reason: `no "${definition.binary}" on PATH` });
        continue;
      }
      return { model, skipped };
    }
    return { model: null, skipped };
  }

  /**
   * The model a run will actually use, or why it cannot. The request's choice
   * and the session's last are taken as named and checked strictly - a silent
   * switch of provider mid-session would surprise - while a run naming none
   * walks the preferences. Checked here, before a run row exists, so the
   * answer is a 400 at submit rather than a run that dies on spawn.
   */
  async resolveModel(
    requested: string | null | undefined,
    inherited: string | null | undefined,
  ): Promise<{ model: string; providerId: string; cliModel?: string }> {
    const named = requested ?? inherited;
    if (named === null || named === undefined) {
      const { model, skipped } = await this.effectiveModel();
      if (model === null) {
        const why = skipped.map((s) => `${s.model} (${s.reason})`).join(', ');
        throw new ProviderError(
          `no preferred model is usable: ${why}; enable or install one in settings`,
        );
      }
      return this.checkNamed(model);
    }
    return this.checkNamed(named);
  }

  private async checkNamed(
    model: string,
  ): Promise<{ model: string; providerId: string; cliModel?: string }> {
    const { providerId, cliModel } = parseModel(model);
    const definition = this.definitionFor(model);
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

  /** The registry entry a model names, or the ProviderError saying why there is none. */
  private definitionFor(model: string) {
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
    return definition;
  }

  /**
   * Every entry must name a known provider (and a suffix only where it pins);
   * it need not be enabled or installed, since that is what the order is for.
   * Duplicates collapse to their first position.
   */
  async setModelPreferences(models: string[]): Promise<void> {
    const unique = [...new Set(models)];
    for (const model of unique) this.definitionFor(model);
    await this.settings.setModelPreferences(unique);
  }

  async setEnabled(id: string, enabled: boolean): Promise<ProviderStatus> {
    if (!findProvider(id)) {
      throw new ProviderError(`unknown provider "${id}"`);
    }
    await this.settings.setProviderEnabled(id, enabled);
    return (await this.get(id))!;
  }
}
