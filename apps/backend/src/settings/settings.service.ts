import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Application settings, JSON-encoded in the `setting` table. This is the only
 * reader and writer, and the one place that knows each value's type; callers
 * get typed accessors, never raw keys.
 */
@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async read<T>(key: string, fallback: T): Promise<T> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    if (!row) return fallback;
    try {
      return JSON.parse(row.value) as T;
    } catch {
      // A value written outside this service. Behave as if unset rather than
      // taking every caller down with a parse error.
      return fallback;
    }
  }

  private async write(key: string, value: unknown): Promise<void> {
    const encoded = JSON.stringify(value);
    await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: encoded },
      update: { value: encoded },
    });
  }

  /**
   * The model a run gets when neither the request nor the session names one.
   * "<provider>" or "<provider>:<model>", validated by ProvidersService before
   * it is stored. Unset means the first provider in the registry.
   */
  getDefaultModel(): Promise<string | null> {
    return this.read<string | null>('defaultModel', null);
  }

  setDefaultModel(model: string): Promise<void> {
    return this.write('defaultModel', model);
  }

  /** Every provider is enabled until someone turns it off. */
  isProviderEnabled(providerId: string): Promise<boolean> {
    return this.read<boolean>(`providers.${providerId}.enabled`, true);
  }

  setProviderEnabled(providerId: string, enabled: boolean): Promise<void> {
    return this.write(`providers.${providerId}.enabled`, enabled);
  }
}
