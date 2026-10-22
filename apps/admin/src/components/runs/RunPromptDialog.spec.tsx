import { render, screen, waitFor } from '@testing-library/react';
import RunPromptDialog from './RunPromptDialog';
import { getSettings, listPrompts, listProviders } from '#/lib/api';
import type { Provider } from '#/lib/types';

jest.mock('#/lib/api', () => ({
  listProviders: jest.fn(),
  getSettings: jest.fn(),
  listPrompts: jest.fn(),
  createPrompt: jest.fn(),
  deletePrompt: jest.fn(),
}));

const providers = jest.mocked(listProviders);
const settings = jest.mocked(getSettings);

const claude: Provider = {
  id: 'claude',
  label: 'Claude Code',
  binary: 'claude',
  pinnable: true,
  models: ['sonnet'],
  available: true,
  path: '/opt/homebrew/bin/claude',
  enabled: true,
};

describe('RunPromptDialog', () => {
  beforeEach(() => {
    providers.mockReset().mockResolvedValue([claude]);
    settings.mockReset();
    jest.mocked(listPrompts).mockResolvedValue([]);
  });

  const open = () =>
    render(
      <RunPromptDialog open onOpenChange={() => {}} onSubmit={jest.fn()} />,
    );

  it('suggests the usable models and names the default it would apply', async () => {
    settings.mockResolvedValue({
      modelPreferences: ['claude'],
      effectiveModel: 'claude',
      unusable: [],
    });
    open();
    await waitFor(() =>
      expect(screen.getByText(/the default \(claude\)/)).toBeTruthy(),
    );
    const options = Array.from(
      document.querySelectorAll('#run-model-options option'),
    ).map((o) => (o as HTMLOptionElement).value);
    expect(options).toEqual(['claude', 'claude:sonnet']);
    expect(screen.queryByText(/No provider can take this run/)).toBeNull();
  });

  it('warns, with a way to the settings, when no provider can take a run', async () => {
    providers.mockResolvedValue([{ ...claude, enabled: false }]);
    settings.mockResolvedValue({
      modelPreferences: ['claude'],
      effectiveModel: null,
      unusable: [{ model: 'claude', reason: 'disabled' }],
    });
    open();
    expect(
      await screen.findByText(/No provider can take this run/),
    ).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /Providers/ }).getAttribute('href'),
    ).toBe('/settings/providers');
    expect(document.querySelectorAll('#run-model-options option')).toHaveLength(
      0,
    );
  });
});
