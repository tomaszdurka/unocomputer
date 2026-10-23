import {
  act,
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

/** The preference rows, in order. */
const preferenceRows = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-sortable-id]'));

// jsdom lays nothing out; give the rows stacked rectangles so a keyboard move
// has somewhere to go (libs/ui's sortable-list.spec uses the same trick).
const ROW = 40;
const originalRect = HTMLElement.prototype.getBoundingClientRect;
beforeAll(() => {
  HTMLElement.prototype.getBoundingClientRect = function () {
    const row = this.closest('[data-sortable-id]');
    const rows = preferenceRows();
    const index = row ? rows.indexOf(row as HTMLElement) : -1;
    const top = index < 0 ? 0 : index * ROW;
    const height = row ? ROW : rows.length * ROW;
    return {
      x: 0,
      y: top,
      top,
      bottom: top + height,
      left: 0,
      right: 200,
      width: 200,
      height,
      toJSON: () => ({}),
    } as DOMRect;
  };
});
afterAll(() => {
  HTMLElement.prototype.getBoundingClientRect = originalRect;
});

async function press(target: HTMLElement, code: string, key: string) {
  await act(async () => {
    fireEvent.keyDown(target, { code, key });
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

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
  unusable: [{ model: 'devin', reason: 'no "devin" on PATH' }],
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
    expect(
      within(screen.getByRole('table')).getByText('Not installed'),
    ).toBeTruthy();
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

  it('shows the order, which entry will be used, and why others cannot be', async () => {
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    const rows = preferenceRows();
    expect(rows.map((r) => r.getAttribute('data-sortable-id'))).toEqual([
      'devin',
      'claude',
      'codex',
    ]);
    expect(within(rows[0]).getByText('Not installed')).toBeTruthy();
    expect(within(rows[1]).getByText('Will be used')).toBeTruthy();
  });

  it('marks an unusable entry after the one that will be used, not only before it', async () => {
    settings.mockResolvedValue({
      modelPreferences: ['claude', 'devin', 'codex'],
      effectiveModel: 'claude',
      unusable: [{ model: 'devin', reason: 'no "devin" on PATH' }],
    });
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    const rows = preferenceRows();
    expect(within(rows[0]).getByText('Will be used')).toBeTruthy();
    expect(within(rows[1]).getByText('Not installed')).toBeTruthy();
    expect(within(rows[2]).queryByText(/used|installed|Disabled/)).toBeNull();
  });

  it('strikes through and greys what will not be used, and bolds what will', async () => {
    settings.mockResolvedValue({
      modelPreferences: ['devin', 'claude', 'codex'],
      effectiveModel: 'claude',
      unusable: [{ model: 'devin', reason: 'no "devin" on PATH' }],
    });
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    const name = (model: string) =>
      within(
        preferenceRows().find(
          (r) => r.getAttribute('data-sortable-id') === model,
        )!,
      ).getByText(model, { selector: 'span' });
    expect(name('devin').className).toMatch(/line-through/);
    expect(name('devin').className).toMatch(/text-gray-400/);
    expect(name('claude').className).toMatch(/font-semibold/);
    expect(name('claude').className).not.toMatch(/line-through/);
    expect(name('codex').className).not.toMatch(/line-through|font-semibold/);
  });

  it('warns when nothing in the order can be used', async () => {
    list.mockResolvedValue([
      { ...claude, enabled: false },
      { ...codex, enabled: false },
      devin,
    ]);
    settings.mockResolvedValue({
      modelPreferences: ['claude', 'codex', 'devin'],
      effectiveModel: null,
      unusable: [
        { model: 'claude', reason: 'disabled' },
        { model: 'codex', reason: 'disabled' },
        { model: 'devin', reason: 'no "devin" on PATH' },
      ],
    });
    render(<ProvidersSettings />);
    expect(await screen.findByText('No model can be used')).toBeTruthy();
    expect(screen.queryByText('Will be used')).toBeNull();
  });

  it('shows no warning while something can be used', async () => {
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    expect(screen.queryByText('No model can be used')).toBeNull();
  });

  it('reorders by dragging a handle and saves the new order', async () => {
    patchSettings.mockResolvedValue({
      ...initial,
      modelPreferences: ['claude', 'devin', 'codex'],
    });
    render(<ProvidersSettings />);
    await screen.findByText('Claude Code');
    const [devinHandle] = screen.getAllByRole('button', {
      name: 'Drag to reorder',
    });
    devinHandle.focus();
    await press(devinHandle, 'Space', ' ');
    await press(devinHandle, 'ArrowDown', 'ArrowDown');
    await press(devinHandle, 'Space', ' ');
    await waitFor(() =>
      expect(patchSettings).toHaveBeenCalledWith({
        modelPreferences: ['claude', 'devin', 'codex'],
      }),
    );
    // The rows follow the saved order, not the drop.
    await waitFor(() =>
      expect(
        preferenceRows().map((r) => r.getAttribute('data-sortable-id')),
      ).toEqual(['claude', 'devin', 'codex']),
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
      unusable: [...initial.unusable, { model: 'claude', reason: 'disabled' }],
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
    const rows = preferenceRows();
    expect(within(rows[2]).getByText('Will be used')).toBeTruthy();
    expect(within(rows[1]).getByText('Disabled')).toBeTruthy();
  });

  it("shows the backend's reason when a change is refused, and keeps the old state", async () => {
    patchSettings.mockRejectedValue(
      new ApiError(400, '/settings', 'unknown provider "jev"'),
    );
    render(<ProvidersSettings />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove devin' }),
    );
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/unknown provider/);
    expect(preferenceRows()[0].getAttribute('data-sortable-id')).toBe('devin');
  });
});
