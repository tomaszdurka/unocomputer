'use client';

import { useEffect, useState } from 'react';
import { Alert, Badge, Button, DataTable, type Column } from '@app/ui';
import {
  ApiError,
  listProviders,
  getSettings,
  updateProvider,
  updateSettings,
} from '#/lib/api';
import { modelNames, type AppSettings, type Provider } from '#/lib/types';

/**
 * Which CLIs a run can go to, and in what order a run that names none tries
 * them. Every change is saved as it is made; there is no form.
 *
 * The preference list is the whole story of "the default": a run takes the
 * first entry whose provider is enabled and installed, so switching a provider
 * off never strands anything - it just moves a run down the list.
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
      // Which preference is effective may have changed with it.
      setSettings(await getSettings());
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not update provider');
    } finally {
      setBusy(null);
    }
  };

  const savePreferences = async (modelPreferences: string[]) => {
    setBusy('preferences');
    try {
      setSettings(await updateSettings({ modelPreferences }));
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save the order');
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

  const prefs = settings.modelPreferences;
  const move = (index: number, by: -1 | 1) => {
    const next = [...prefs];
    const [item] = next.splice(index, 1);
    next.splice(index + by, 0, item);
    void savePreferences(next);
  };
  const remove = (index: number) => {
    void savePreferences(prefs.filter((_, i) => i !== index));
  };
  const add = (model: string) => {
    if (model && !prefs.includes(model))
      void savePreferences([...prefs, model]);
  };

  // Everything known that is not yet in the order, usable or not: the order
  // exists precisely to skip the ones that are not.
  const addable = providers
    .flatMap(modelNames)
    .filter((model) => !prefs.includes(model));

  const unusableReason = new Map(
    settings.unusable.map((u) => [u.model, u.reason]),
  );

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
      cell: (p) => (
        <ul className="space-y-0.5 font-mono text-xs text-gray-600 dark:text-neutral-300">
          {modelNames(p).map((model) => (
            <li key={model}>{model}</li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {settings.effectiveModel === null ? (
        <Alert variant="warning" title="No model can be used">
          Every provider is disabled or not installed, so a run that names no
          model will be refused. Enable one below, or install its CLI where the
          backend can see it.
        </Alert>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Providers</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            Available means the CLI is on the backend&apos;s PATH. A provider
            that is off is refused when a run asks for it by name, and skipped
            by the order below.
          </p>
        </div>
        <DataTable
          columns={columns}
          rows={providers}
          rowKey={(p) => p.id}
          empty="The backend knows no providers."
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium">Model preference</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">
            What a run uses when it names no model and its session has none yet:
            the first entry whose provider is enabled and installed.
          </p>
        </div>
        <ol
          aria-label="Model preference"
          className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900"
        >
          {prefs.map((model, index) => {
            const reason = unusableReason.get(model);
            const effective = model === settings.effectiveModel;
            return (
              <li
                key={model}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <span
                  className={`w-5 text-right text-xs ${
                    reason
                      ? 'text-gray-300 dark:text-neutral-700'
                      : 'text-gray-400 dark:text-neutral-500'
                  }`}
                >
                  {index + 1}
                </span>
                {/* The eye should get it before the badge does: what will not be
                    used is struck through and greyed, what will be used is bold. */}
                <span
                  className={`flex-1 font-mono ${
                    reason
                      ? 'text-gray-400 line-through dark:text-neutral-600'
                      : effective
                        ? 'font-semibold'
                        : ''
                  }`}
                >
                  {model}
                </span>
                {effective ? (
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    Will be used
                  </Badge>
                ) : reason ? (
                  <Badge variant="muted" title={`Will not be used: ${reason}`}>
                    {reason === 'disabled' ? 'Disabled' : 'Not installed'}
                  </Badge>
                ) : null}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Move ${model} up`}
                    disabled={index === 0 || busy === 'preferences'}
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Move ${model} down`}
                    disabled={
                      index === prefs.length - 1 || busy === 'preferences'
                    }
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${model}`}
                    disabled={prefs.length === 1 || busy === 'preferences'}
                    onClick={() => remove(index)}
                  >
                    ✕
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
        {addable.length ? (
          <select
            aria-label="Add to the order"
            value=""
            disabled={busy === 'preferences'}
            onChange={(e) => add(e.target.value)}
            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <option value="">Add a model to the order...</option>
            {addable.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        ) : null}
      </section>
    </div>
  );
}
