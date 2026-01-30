import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

let posthogProviderRendered = false;
vi.mock("posthog-js", () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
  },
}));

vi.mock("posthog-js/react", () => ({
  PostHogProvider: ({
    children,
  }: {
    children: React.ReactNode;
    client: unknown;
  }) => {
    posthogProviderRendered = true;
    return <div data-testid="posthog-provider">{children}</div>;
  },
}));

vi.mock("@tanstack/react-query", () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@tanstack/react-query-devtools", () => ({
  ReactQueryDevtools: () => null,
}));

vi.mock("@/trpc/client", () => ({
  queryClient: {},
}));

vi.mock("./theme-provider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

let toasterRendered = false;

vi.mock("./ui/sonner", () => ({
  Toaster: () => {
    toasterRendered = true;
    return <div data-testid="toaster" />;
  },
}));

// Must import after vi.mock declarations
const { default: Providers } = await import("./providers");

describe("Providers", () => {
  afterEach(() => {
    cleanup();
    posthogProviderRendered = false;
    toasterRendered = false;
  });

  it("always renders children inside PostHogProvider", () => {
    render(
      <Providers>
        <div data-testid="child" />
      </Providers>,
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByTestId("posthog-provider")).toBeDefined();
    expect(posthogProviderRendered).toBe(true);
  });

  it("always renders Toaster", () => {
    render(
      <Providers>
        <div />
      </Providers>,
    );

    expect(screen.getByTestId("toaster")).toBeDefined();
    expect(toasterRendered).toBe(true);
  });
});
