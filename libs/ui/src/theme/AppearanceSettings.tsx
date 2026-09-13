'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '../icons';

type Theme = 'system' | 'light' | 'dark';

const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'system', label: 'System', icon: <MonitorIcon /> },
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
];

function applyTheme(theme: Theme) {
  if (theme === 'system') {
    localStorage.removeItem('theme');
  } else {
    localStorage.setItem('theme', theme);
  }
  // Picked up by the init script in the root layout.
  window.dispatchEvent(new Event('theme-change'));
}

export function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') setTheme(stored);
  }, []);

  const select = (value: Theme) => {
    setTheme(value);
    applyTheme(value);
  };

  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => select(option.value)}
          className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors ${
            theme === option.value
              ? 'border-[var(--ui-accent)] bg-[var(--ui-accent)] text-[var(--ui-accent-fg)]'
              : 'border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
          }`}
        >
          <span className="[&>svg]:size-4">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );
}
