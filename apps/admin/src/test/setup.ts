// next/navigation's hooks require an app-router context that only exists when Next is
// actually running. Component tests render in isolation, so the hooks are stubbed here
// once rather than in every spec. usePathname returns a route that no NavItem matches,
// so nothing renders as active unless a test says so.
const push = jest.fn();
const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, back: jest.fn(), forward: jest.fn(), refresh: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

export const routerMock = { push, replace };
