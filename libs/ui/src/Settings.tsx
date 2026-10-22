// The settings-page building blocks: a titled card of rows, each row a label on the
// left and its control on the right. Concrete controls (text, select, switch) are
// app code composed from Field/Select/Switch - only the skeleton lives here.

export type SettingsSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsSection({
  title,
  description,
  action,
  children,
}: SettingsSectionProps) {
  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white px-6 py-5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export type SettingRowProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingRow({
  label,
  description,
  error,
  children,
}: SettingRowProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-gray-200 py-4 last:border-b-0 sm:flex-row sm:items-start sm:justify-between sm:gap-8 dark:border-neutral-800">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {description ? (
          <div className="text-sm text-gray-500 dark:text-neutral-400">
            {description}
          </div>
        ) : null}
        {error ? (
          <div className="mt-0.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  );
}
