import { fireEvent, render, screen } from '@testing-library/react';
import {
  Monogram,
  NavItem,
  SIDEBAR_MODE_COOKIE,
  Sidebar,
  SidebarSection,
  sidebarModeFrom,
  type SidebarItem,
} from '@app/ui';

// NavItem highlights the current route. The App Router is not mounted in jsdom, so
// the pathname is whatever the test says it is.
let mockPathname = '/';
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }));

const items: SidebarItem[] = [
  { href: '/', label: 'Items' },
  { href: '/runs', label: 'Runs' },
];

function link(name: string): HTMLAnchorElement {
  return screen.getByRole('link', { name }) as HTMLAnchorElement;
}

beforeEach(() => {
  mockPathname = '/';
  document.cookie = `${SIDEBAR_MODE_COOKIE}=; path=/; max-age=0`;
});

describe('sidebarModeFrom', () => {
  it('only ever collapses on the exact stored value', () => {
    expect(sidebarModeFrom('collapsed')).toBe('collapsed');
    expect(sidebarModeFrom('expanded')).toBe('expanded');
  });

  it('falls back to expanded for a missing or unrecognised cookie', () => {
    expect(sidebarModeFrom(undefined)).toBe('expanded');
    expect(sidebarModeFrom(null)).toBe('expanded');
    expect(sidebarModeFrom('')).toBe('expanded');
    expect(sidebarModeFrom('sideways')).toBe('expanded');
  });
});

describe('Monogram', () => {
  it('takes the first letter of the first two words, upper-cased', () => {
    render(<Monogram name="website manager" />);
    expect(screen.getByText('WM')).toBeTruthy();
  });

  it('gives one letter for one word and ignores words past the second', () => {
    const { rerender } = render(<Monogram name="Alpha" />);
    expect(screen.getByText('A')).toBeTruthy();

    rerender(<Monogram name="  one   two three " />);
    expect(screen.getByText('OT')).toBeTruthy();
  });

  it('shows a placeholder for a blank name and hides itself from assistive tech', () => {
    render(<Monogram name="   " />);

    const monogram = screen.getByText('?');
    expect(monogram.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('NavItem', () => {
  it('marks the exact route current and nothing nested under it', () => {
    mockPathname = '/items/new';
    const { rerender } = render(<NavItem href="/items">Items</NavItem>);
    expect(link('Items').getAttribute('aria-current')).toBeNull();

    mockPathname = '/items';
    rerender(<NavItem href="/items">Items</NavItem>);
    expect(link('Items').getAttribute('aria-current')).toBe('page');
  });

  it('with prefix matching, highlights nested routes but not a sibling that merely shares the prefix', () => {
    mockPathname = '/items/42/edit';
    const { rerender } = render(
      <NavItem href="/items" match="prefix">
        Items
      </NavItem>,
    );
    expect(link('Items').getAttribute('aria-current')).toBe('page');

    mockPathname = '/itemsets';
    rerender(
      <NavItem href="/items" match="prefix">
        Items
      </NavItem>,
    );
    expect(link('Items').getAttribute('aria-current')).toBeNull();
  });

  it('outside a Sidebar renders expanded: label on screen, no tooltip', () => {
    render(<NavItem href="/runs">Runs</NavItem>);

    const runs = link('Runs');
    expect(runs.title).toBe('');
    expect(runs.querySelector('.sr-only')).toBeNull();
  });

  it('on the rail keeps the label for assistive tech and names the tooltip from it', () => {
    render(
      <Sidebar brandName="App" items={[]} initialMode="collapsed">
        <NavItem href="/runs">Runs</NavItem>
      </Sidebar>,
    );

    const runs = link('Runs');
    expect(runs.title).toBe('Runs');
    expect(runs.querySelector('.sr-only')?.textContent).toBe('Runs');
  });

  it('uses the explicit label for the tooltip when the children are not plain text', () => {
    render(
      <Sidebar brandName="App" items={[]} initialMode="collapsed">
        <NavItem href="/runs" label="Runs (3 failing)">
          <span>Runs</span>
          <span>3</span>
        </NavItem>
      </Sidebar>,
    );

    expect(screen.getByTitle('Runs (3 failing)').tagName).toBe('A');
  });

  it('shows the collapsed icon only on the rail', () => {
    const item = (
      <NavItem
        href="/p/1"
        icon={<svg data-testid="shared-icon" />}
        collapsedIcon={<Monogram name="Project One" />}
      >
        Project One
      </NavItem>
    );

    const expanded = render(
      <Sidebar brandName="App" items={[]} initialMode="expanded">
        {item}
      </Sidebar>,
    );
    expect(screen.getByTestId('shared-icon')).toBeTruthy();
    expect(screen.queryByText('PO')).toBeNull();
    expanded.unmount();

    render(
      <Sidebar brandName="App" items={[]} initialMode="collapsed">
        {item}
      </Sidebar>,
    );
    expect(screen.queryByTestId('shared-icon')).toBeNull();
    expect(screen.getByText('PO')).toBeTruthy();
  });
});

describe('Sidebar', () => {
  it('starts expanded unless the layout passes the stored mode', () => {
    const bare = render(<Sidebar brandName="App" items={items} />);
    expect(bare.container.querySelector('aside')?.dataset.mode).toBe(
      'expanded',
    );
    bare.unmount();

    const stored = render(
      <Sidebar brandName="App" items={items} initialMode="collapsed" />,
    );
    expect(stored.container.querySelector('aside')?.dataset.mode).toBe(
      'collapsed',
    );
  });

  it('persists a toggle under the cookie name the server layout reads', () => {
    render(<Sidebar brandName="App" items={items} />);

    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(document.cookie).toContain(`${SIDEBAR_MODE_COOKIE}=collapsed`);

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(document.cookie).toContain(`${SIDEBAR_MODE_COOKIE}=expanded`);
  });

  it('points the pinned Settings entry at settingsHref, defaulting to /settings', () => {
    const { rerender } = render(<Sidebar brandName="App" items={items} />);
    expect(link('Settings').getAttribute('href')).toBe('/settings');

    rerender(
      <Sidebar brandName="App" items={items} settingsHref="/admin/settings" />,
    );
    expect(link('Settings').getAttribute('href')).toBe('/admin/settings');
  });

  it('drops a section title and action on the rail but keeps its items', () => {
    const section = (
      <SidebarSection
        title="Projects"
        action={<button type="button">Add</button>}
      >
        <NavItem href="/p/1">Project One</NavItem>
      </SidebarSection>
    );

    const expanded = render(
      <Sidebar brandName="App" items={items} initialMode="expanded">
        {section}
      </Sidebar>,
    );
    expect(screen.getByText('Projects')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
    expanded.unmount();

    render(
      <Sidebar brandName="App" items={items} initialMode="collapsed">
        {section}
      </Sidebar>,
    );
    expect(screen.queryByText('Projects')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
    expect(link('Project One')).toBeTruthy();
  });
});
