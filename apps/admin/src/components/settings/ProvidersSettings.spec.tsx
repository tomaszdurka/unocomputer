import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import ProvidersSettings from './ProvidersSettings';
import {
  ApiError,
  getSettings,
  listProviders,
  updateProvider,
  updateSettings,
} from '#/lib/api';
import type { AppSettings, Provider } from '#/lib/types';

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
  models: ['o3'],
});

const initial: AppSettings = {
  modelPreferences: ['devin', 'claude', 'codex'],
  effectiveModel: 'claude',
  skipped: [{ model: 'devin', reason: 'no "devin" on PATH' }],
};

describe('ProvidersSettings', () => {
  beforeEach(() => {
    list.mockReset().mockResolvedValue([claude, codex, devin]);
    settings.mockReset().mockResolvedValue(initial);
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

  it("lists a provider's models one per line", async () => {
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    const row = screen.getByText('Claude Code').closest('tr')!;
    const items = within(row)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(items).toEqual(['claude', 'claude:sonnet']);
  });

  it('shows the order, which entry will be used, and why others are skipped', async () => {
    render(<ProvidersSettings />);
    const order = await screen.findByRole('list', { name: 'Model preference' });
    const rows = within(order).getAllByRole('listitem');
    expect(
      rows.map((r) => within(r).getByText(/^(devin|claude|codex)/).textContent),
    ).toEqual(['devin', 'claude', 'codex']);
    expect(
      within(rows[0]).getByText(/Skipped: no "devin" on PATH/),
    ).toBeTruthy();
    expect(within(rows[1]).getByText('Will be used')).toBeTruthy();
  });

  it('moves an entry and saves the new order', async () => {
    patchSettings.mockResolvedValue({
      ...initial,
      modelPreferences: ['claude', 'devin', 'codex'],
    });
    render(<ProvidersSettings />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Move claude up' }),
    );
    await waitFor(() =>
      expect(patchSettings).toHaveBeenCalledWith({
        modelPreferences: ['claude', 'devin', 'codex'],
      }),
    );
  });

  it('removes an entry, but never the last one', async () => {
    patchSettings.mockResolvedValue({
      ...initial,
      modelPreferences: ['claude', 'codex'],
    });
    render(<ProvidersSettings />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove devin' }),
    );
    await waitFor(() =>
      expect(patchSettings).toHaveBeenCalledWith({
        modelPreferences: ['claude', 'codex'],
      }),
    );
  });

  it('offers only models not yet in the order, and appends the chosen one', async () => {
    patchSettings.mockResolvedValue({
      ...initial,
      modelPreferences: [...initial.modelPreferences, 'codex:o3'],
    });
    render(<ProvidersSettings />);
    const add = (await screen.findByLabelText(
      'Add to the order',
    )) as HTMLSelectElement;
    const options = Array.from(add.options)
      .map((o) => o.value)
      .filter(Boolean);
    expect(options).toEqual(['claude:sonnet', 'codex:o3', 'devin:opus']);
    fireEvent.change(add, { target: { value: 'codex:o3' } });
    await waitFor(() =>
      expect(patchSettings).toHaveBeenCalledWith({
        modelPreferences: ['devin', 'claude', 'codex', 'codex:o3'],
      }),
    );
  });

  it('toggles a provider and refreshes which preference is effective', async () => {
    patchProvider.mockResolvedValue({ ...claude, enabled: false });
    settings.mockResolvedValueOnce(initial).mockResolvedValueOnce({
      ...initial,
      effectiveModel: 'codex',
      skipped: [...initial.skipped, { model: 'claude', reason: 'disabled' }],
    });
    render(<ProvidersSettings />);
    const toggle = await screen.findByRole('switch', {
      name: 'Claude Code enabled',
    });
    fireEvent.click(toggle);
    await waitFor(() =>
      expect(patchProvider).toHaveBeenCalledWith('claude', { enabled: false }),
    );
    await waitFor(() =>
      expect(toggle.getAttribute('aria-checked')).toBe('false'),
    );
    const order = screen.getByRole('list', { name: 'Model preference' });
    const rows = within(order).getAllByRole('listitem');
    expect(within(rows[2]).getByText('Will be used')).toBeTruthy();
    expect(within(rows[1]).getByText(/Skipped: disabled/)).toBeTruthy();
  });

  it("shows the backend's reason when a change is refused, and keeps the old state", async () => {
    patchSettings.mockRejectedValue(
      new ApiError(400, '/settings', 'unknown provider "jev"'),
    );
    render(<ProvidersSettings />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Move claude up' }),
    );
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/unknown provider/);
    const order = screen.getByRole('list', { name: 'Model preference' });
    expect(within(order).getAllByRole('listitem')[0].textContent).toMatch(
      /devin/,
    );
  });
});
