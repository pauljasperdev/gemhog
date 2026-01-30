import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockOptIn = vi.fn(() => {
  mockConsentStatus = "granted";
});
const mockOptOut = vi.fn(() => {
  mockConsentStatus = "denied";
});
let mockConsentStatus = "pending";
let posthogKey: string | undefined;

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({
    get_explicit_consent_status: () => mockConsentStatus,
    opt_in_capturing: mockOptIn,
    opt_out_capturing: mockOptOut,
  }),
}));

vi.mock("@gemhog/env/web", () => ({
  env: {
    get NEXT_PUBLIC_POSTHOG_KEY() {
      return posthogKey;
    },
  },
}));

// Must import after vi.mock declarations
const { CookieConsentBanner, CookieSettingsButton } = await import(
  "./cookie-consent"
);

afterEach(() => {
  cleanup();
  posthogKey = undefined;
});

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    mockConsentStatus = "pending";
    mockOptIn.mockClear();
    mockOptOut.mockClear();
  });

  it("renders nothing when NEXT_PUBLIC_POSTHOG_KEY is not set", () => {
    posthogKey = undefined;
    const { container } = render(<CookieConsentBanner />);
    expect(container.innerHTML).toBe("");
  });

  it("shows banner when consent status is pending", () => {
    posthogKey = "phc_test_key";
    render(<CookieConsentBanner />);

    expect(
      screen.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeDefined();
    expect(screen.getByText("Would you like a cookie?")).toBeDefined();
  });

  it("calls opt_in_capturing and hides on Accept click", async () => {
    posthogKey = "phc_test_key";
    const user = userEvent.setup();
    render(<CookieConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(mockOptIn).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("calls opt_out_capturing and hides on Decline click", async () => {
    posthogKey = "phc_test_key";
    const user = userEvent.setup();
    render(<CookieConsentBanner />);

    await user.click(screen.getByRole("button", { name: "Decline" }));

    expect(mockOptOut).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("re-opens when show-cookie-consent event fires", () => {
    posthogKey = undefined;
    render(<CookieConsentBanner />);

    // Banner not visible initially
    expect(screen.queryByRole("dialog")).toBeNull();

    // Dispatch custom event to re-open
    act(() => {
      window.dispatchEvent(new CustomEvent("show-cookie-consent"));
    });

    expect(
      screen.getByRole("dialog", { name: "Cookie consent" }),
    ).toBeDefined();
  });

  it("does not show when consent already granted", () => {
    posthogKey = "phc_test_key";
    mockConsentStatus = "granted";
    const { container } = render(<CookieConsentBanner />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("CookieSettingsButton", () => {
  it("renders with default text", () => {
    render(<CookieSettingsButton />);
    expect(
      screen.getByRole("button", { name: "Cookie Settings" }),
    ).toBeDefined();
  });

  it("renders with custom children", () => {
    render(<CookieSettingsButton>Manage Cookies</CookieSettingsButton>);
    expect(
      screen.getByRole("button", { name: "Manage Cookies" }),
    ).toBeDefined();
  });

  it("dispatches show-cookie-consent event on click", async () => {
    const user = userEvent.setup();
    const listener = vi.fn();
    window.addEventListener("show-cookie-consent", listener);

    render(<CookieSettingsButton />);
    await user.click(screen.getByRole("button", { name: "Cookie Settings" }));

    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("show-cookie-consent", listener);
  });
});
