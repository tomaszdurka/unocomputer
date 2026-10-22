import { fireEvent, render, screen } from '@testing-library/react';
import { AppearanceSettings, themeInitScript } from '@app/ui';

// jsdom has no matchMedia. This stand-in lets a test pick the OS preference and
// flip it later, as the OS would.
function stubMatchMedia(initial: boolean) {
  const listeners: Array<() => void> = [];
  const media = {
    matches: initial,
    addEventListener: (_type: string, listener: () => void) =>
      listeners.push(listener),
  };
  window.matchMedia = (() => media) as unknown as typeof window.matchMedia;
  return {
    set(matches: boolean) {
      media.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}

function runInitScript() {
  new Function(themeInitScript)();
}

function isDark(): boolean {
  return document.documentElement.classList.contains('dark');
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove('dark');
});

describe('themeInitScript', () => {
  it('applies a stored dark choice', () => {
    stubMatchMedia(false);
    localStorage.setItem('theme', 'dark');

    runInitScript();

    expect(isDark()).toBe(true);
  });

  it('lets a stored light choice override a dark OS', () => {
    stubMatchMedia(true);
    localStorage.setItem('theme', 'light');

    runInitScript();

    expect(isDark()).toBe(false);
  });

  it('follows the OS when nothing is stored, including later changes', () => {
    const os = stubMatchMedia(false);

    runInitScript();
    expect(isDark()).toBe(false);

    os.set(true);
    expect(isDark()).toBe(true);
  });

  it('re-reads the choice on the theme-change event the settings page fires', () => {
    stubMatchMedia(false);
    runInitScript();
    expect(isDark()).toBe(false);

    localStorage.setItem('theme', 'dark');
    window.dispatchEvent(new Event('theme-change'));

    expect(isDark()).toBe(true);
  });

  it('never throws in a browser without matchMedia', () => {
    window.matchMedia = undefined as unknown as typeof window.matchMedia;

    expect(runInitScript).not.toThrow();
  });
});

describe('AppearanceSettings', () => {
  function pressed(name: string): boolean {
    return (
      screen.getByRole('button', { name }).getAttribute('aria-pressed') ===
      'true'
    );
  }

  it('starts on System and reflects a stored choice after mount', () => {
    const first = render(<AppearanceSettings />);
    expect(pressed('System')).toBe(true);
    first.unmount();

    localStorage.setItem('theme', 'dark');
    render(<AppearanceSettings />);
    expect(pressed('Dark')).toBe(true);
    expect(pressed('System')).toBe(false);
  });

  it('stores an explicit theme and tells the init script', () => {
    const onThemeChange = jest.fn();
    window.addEventListener('theme-change', onThemeChange);
    render(<AppearanceSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Light' }));

    expect(localStorage.getItem('theme')).toBe('light');
    expect(onThemeChange).toHaveBeenCalledTimes(1);
    expect(pressed('Light')).toBe(true);
    window.removeEventListener('theme-change', onThemeChange);
  });

  it('clears the stored theme when System is picked', () => {
    localStorage.setItem('theme', 'dark');
    render(<AppearanceSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'System' }));

    expect(localStorage.getItem('theme')).toBeNull();
    expect(pressed('System')).toBe(true);
  });
});
