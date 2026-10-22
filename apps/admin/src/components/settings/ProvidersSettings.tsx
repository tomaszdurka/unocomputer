'use client';

import { useEffect, useState } from 'react';
import { Badge, DataTable, type Column } from '@app/ui';
import {
  ApiError,
  listProviders,
  getSettings,
  updateProvider,
  updateSettings,
} from '#/lib/api';
import { modelChoices, type AppSettings, type Provider } from '#/lib/types';

/**
 * One row per provider the backend knows: whether its CLI is on the backend's
 * PATH, and whether it is switched on. Above it, the model runs get when they
 * name none. Every change is saved as it is made; there is no form.
 */
export default function ProvidersSettings() {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listProviders(), getSettings()])
      .then(([p, s]) => {
        if (cancelled) return;
        setProviders(p);
        setSettings(s);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Could not load providers');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = async (provider: Provider, enabled: boolean) => {
    setBusy(provider.id);
    try {
      const updated = await updateProvider(provider.id, { enabled });
      setProviders((list) =>
        list ? list.map((p) => (p.id === updated.id ? updated : p)) : list,
      );
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update provider');
    } finally {
      setBusy(null);
    }
  };

  const chooseDefault = async (defaultModel: string) => {
    setBusy('default');
    try {
      setSettings(await updateSettings({ defaultModel }));
      setError(null);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'Could not update the default',
      );
    } finally {
      setBusy(null);
    }
  };

  if (!providers || !settings) {
    return (
      <p className="text-sm text-gray-500 dark:text-neutral-400">
        {error ?? 'Loading providers...'}
      </p>
    );
  }

  const choices = modelChoices(providers);
  // The stored default stays selectable even if its provider is now off or
  // missing, so the picker never silently shows something other than the truth.
  const options = choices.includes(settings.defaultModel)
    ? choices
    : [settings.defaultModel, ...choices];

  const columns: Column<Provider>[] = [
    {
      key: 'provider',
      header: 'Provider',
      cell: (p) => (
        <div>
          <div className="font-medium">{p.label}</div>
          <div className="font-mono text-xs text-gray-500 dark:text-neutral-400">
            {p.id}
          </div>
        </div>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      cell: (p) => (
        <button
          type="button"
          role="switch"
          aria-checked={p.enabled}
          aria-label={`${p.label} enabled`}
          disabled={busy === p.id}
          onClick={() => void toggle(p, !p.enabled)}
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:opacity-50 dark:focus-visible:ring-neutral-500"
        >
          {p.enabled ? (
            <Badge
              variant="outline"
              className="cursor-pointer bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
            >
              Enabled
            </Badge>
          ) : (
            <Badge
              variant="muted"
              className="cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700"
            >
              Disabled
            </Badge>
          )}
        </button>
      ),
    },
    {
      key: 'available',
      header: 'Available',
      cell: (p) =>
        p.available ? (
          <div>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              Available
            </Badge>
            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-neutral-400">
              {p.path}
            </div>
          </div>
        ) : (
          <div>
            <Badge variant="muted">Not installed</Badge>
            <div className="mt-1 font-mono text-xs text-gray-500 dark:text-neutral-400">
              {`no ${p.binary} on PATH`}
            </div>
          </div>
        ),
    },
    {
      key: 'models',
      header: 'Models',
      className: 'text-gray-600 dark:text-neutral-300',
      cell: (p) =>
        p.pinnable && p.models.length
          ? p.models.map((m) => `${p.id}:${m}`).join(', ')
          : 'CLI default',
    },
  ];

  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Default model</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            What a run uses when it names no model and its session has none yet.
          </p>
        </div>
        <select
          aria-label="Default model"
          value={settings.defaultModel}
          disabled={busy === 'default'}
          onChange={(e) => void chooseDefault(e.target.value)}
          className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          {options.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Providers</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Available means the CLI is on the backend&apos;s PATH. A provider
            that is off is refused when a run asks for it.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={providers}
          rowKey={(p) => p.id}
          empty="The backend knows no providers."
        />
      </section>
    </div>
  );
}
