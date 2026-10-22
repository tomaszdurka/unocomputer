import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProvidersSettings from './ProvidersSettings';
import {
  ApiError,
  getSettings,
  listProviders,
  updateProvider,
  updateSettings,
} from '#/lib/api';
import type { Provider } from '#/lib/types';

jest.mock('#/lib/api', () => {
  const actual = jest.requireActual('#/lib/api');
  return {
    ApiError: actual.ApiError,
    listProviders: jest.fn(),
    getSettings: jest.fn(),
    updateProvider: jest.fn(),
    updateSettings: jest.fn(),
  };
});

const list = jest.mocked(listProviders);
const settings = jest.mocked(getSettings);
const patchProvider = jest.mocked(updateProvider);
const patchSettings = jest.mocked(updateSettings);

const provider = (over: Partial<Provider>): Provider => ({
  id: 'claude',
  label: 'Claude Code',
  binary: 'claude',
  pinnable: true,
  models: ['sonnet'],
  available: true,
  path: '/opt/homebrew/bin/claude',
  enabled: true,
  ...over,
});

const claude = provider({});
const devin = provider({
  id: 'devin',
  label: 'Devin',
  binary: 'devin',
  models: ['opus'],
  available: false,
  path: null,
});
const codex = provider({
  id: 'codex',
  label: 'Codex',
  binary: 'codex',
  path: '/opt/homebrew/bin/codex',
  pinnable: false,
  models: [],
});

describe('ProvidersSettings', () => {
  beforeEach(() => {
    list.mockReset().mockResolvedValue([claude, codex, devin]);
    settings.mockReset().mockResolvedValue({ defaultModel: 'claude' });
    patchProvider.mockReset();
    patchSettings.mockReset();
  });

  it('shows each provider with where its CLI was found, or that it is missing', async () => {
    render(<ProvidersSettings />);
    expect(await screen.findByText('Claude Code')).toBeTruthy();
    expect(screen.getByText('/opt/homebrew/bin/claude')).toBeTruthy();
    expect(screen.getByText('Not installed')).toBeTruthy();
    expect(screen.getByText('no devin on PATH')).toBeTruthy();
  });

  it('offers only usable models as the default, plus whatever is stored', async () => {
    settings.mockResolvedValue({ defaultModel: 'devin:opus' });
    render(<ProvidersSettings />);
    const select = (await screen.findByLabelText(
      'Default model',
    )) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    // devin is not installed, so it is not offered - but the stored default stays visible.
    expect(options).toEqual(['devin:opus', 'claude', 'claude:sonnet', 'codex']);
    expect(select.value).toBe('devin:opus');
  });

  it('saves a toggle as it is made', async () => {
    patchProvider.mockResolvedValue({ ...devin, enabled: false });
    render(<ProvidersSettings />);
    const toggle = await screen.findByRole('switch', { name: 'Devin enabled' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(patchProvider).toHaveBeenCalledWith('devin', { enabled: false }),
    );
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('false'),
    );
  });

  it('saves a new default as it is chosen', async () => {
    patchSettings.mockResolvedValue({ defaultModel: 'claude:sonnet' });
    render(<ProvidersSettings />);
    const select = await screen.findByLabelText('Default model');
    fireEvent.change(select, { target: { value: 'claude:sonnet' } });
    await waitFor(() =>
      expect(patchSettings).toHaveBeenCalledWith({
        defaultModel: 'claude:sonnet',
      }),
    );
    await waitFor(() =>
      expect((select as HTMLSelectElement).value).toBe('claude:sonnet'),
    );
  });

  it("shows the backend's reason when a change is refused, and keeps the old state", async () => {
    patchProvider.mockRejectedValue(
      new ApiError(
        400,
        '/providers/claude',
        'Claude Code provides the default model; choose another default first',
      ),
    );
    render(<ProvidersSettings />);
    const toggle = await screen.findByRole('switch', {
      name: 'Claude Code enabled',
    });
    fireEvent.click(toggle);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/provides the default model/);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
