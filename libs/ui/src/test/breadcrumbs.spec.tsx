import { render, screen } from '@testing-library/react';
import { Breadcrumbs } from '@app/ui';

describe('Breadcrumbs', () => {
  it('is a labelled navigation where every item with an href is a link', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/projects' },
          { label: 'Alpha', href: '/projects/1' },
          { label: 'Settings' },
        ]}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(
      screen.getAllByRole('link').map((a) => a.getAttribute('href')),
    ).toEqual(['/projects', '/projects/1']);
  });

  it('marks only the trailing plain item as the current page', () => {
    render(
      <Breadcrumbs
        items={[
          { label: 'Projects' },
          { label: 'Alpha', href: '/projects/1' },
          { label: 'Settings' },
        ]}
      />,
    );

    expect(screen.getByText('Settings').getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      screen.getByText('Projects').getAttribute('aria-current'),
    ).toBeNull();
  });

  it('separates items with decorative chevrons, none before the first', () => {
    const { container } = render(
      <Breadcrumbs
        items={[
          { label: 'A', href: '/a' },
          { label: 'B', href: '/b' },
          { label: 'C' },
        ]}
      />,
    );

    const chevrons = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(chevrons).toHaveLength(2);
    expect(container.querySelector('li')?.querySelector('svg')).toBeNull();
  });
});
