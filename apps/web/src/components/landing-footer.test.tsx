import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/cookie-consent", () => ({
  CookieSettingsButton: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <button type="button" className={className}>
      {children ?? "Cookie Settings"}
    </button>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const { LandingFooter } = await import("./landing-footer");

afterEach(() => {
  cleanup();
});

describe("LandingFooter", () => {
  it("renders copyright with current year", () => {
    render(<LandingFooter />);
    const year = new Date().getFullYear().toString();
    expect(
      screen.getByText(new RegExp(`${year}.*Gemhog|Gemhog.*${year}`)),
    ).toBeDefined();
  });

  it("renders privacy policy link pointing to /privacy", () => {
    render(<LandingFooter />);
    const link = screen.getByRole("link", { name: /privacy policy/i });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/privacy");
  });

  it("renders cookie settings button", () => {
    render(<LandingFooter />);
    expect(
      screen.getByRole("button", { name: /cookie settings/i }),
    ).toBeDefined();
  });
});
