import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();
let mockMutationState = {
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null as { message: string } | null,
  mutateAsync: mockMutateAsync,
};

let mockFormSubscribeState = { canSubmit: true, isSubmitting: false };

let capturedOnMutate: ((vars: unknown) => void) | undefined;
let capturedOnError: (() => void) | undefined;

vi.mock("@tanstack/react-query", () => ({
  useMutation: (opts: {
    onMutate?: (vars: unknown) => void;
    onError?: () => void;
  }) => {
    capturedOnMutate = opts?.onMutate;
    capturedOnError = opts?.onError;
    return mockMutationState;
  },
}));

vi.mock("@tanstack/react-form", () => {
  const { useState } = require("react");

  return {
    useForm: (opts: {
      defaultValues: { email: string };
      onSubmit: (args: { value: { email: string } }) => Promise<void>;
    }) => {
      return {
        Field: ({
          name,
          children,
        }: {
          name: string;
          children: (field: {
            state: {
              value: string;
              meta: { errors: Array<{ message: string }> };
            };
            handleBlur: () => void;
            handleChange: (val: string) => void;
          }) => React.ReactNode;
        }) => {
          const [value, setValue] = useState(
            opts.defaultValues[name as keyof typeof opts.defaultValues] ?? "",
          );
          return children({
            state: { value, meta: { errors: [] } },
            handleBlur: () => {},
            handleChange: (val: string) => setValue(val),
          });
        },
        Subscribe: ({
          children,
        }: {
          children: (state: {
            canSubmit: boolean;
            isSubmitting: boolean;
          }) => React.ReactNode;
        }) => children(mockFormSubscribeState),
        handleSubmit: () => {},
      };
    },
  };
});

vi.mock("@/trpc/client", () => ({
  trpc: {
    subscriber: {
      subscribe: {
        mutationOptions: () => ({}),
      },
    },
  },
}));

vi.mock("@/lib/analytics", () => ({
  AnalyticsEvents: {
    SIGNUP_STARTED: "signup_started",
    SIGNUP_COMPLETED: "signup_completed",
  },
  trackEvent: vi.fn(),
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

const { SignupForm } = await import("../signup-form");

afterEach(() => {
  cleanup();
  mockMutationState = {
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    mutateAsync: mockMutateAsync,
  };
  mockFormSubscribeState = { canSubmit: true, isSubmitting: false };
  capturedOnMutate = undefined;
  capturedOnError = undefined;
});

describe("SignupForm", () => {
  it("renders email input and submit button", () => {
    render(<SignupForm />);
    expect(screen.getByLabelText("Email address")).toBeDefined();
    expect(screen.getByRole("button", { name: /./i })).toBeDefined();
  });

  it("renders privacy consent text with privacy policy link", () => {
    render(<SignupForm />);
    expect(screen.getByText(/by subscribing/i)).toBeDefined();
    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toBeDefined();
    expect(privacyLink.getAttribute("href")).toBe("/privacy");
  });

  it("shows confirmation message on successful subscription", () => {
    render(<SignupForm />);
    act(() => capturedOnMutate?.({ email: "a@b.com" }));
    const statusEl = screen.getByText(
      /check your inbox to confirm your subscription/i,
    );
    expect(statusEl).toBeDefined();
  });

  it("disables submit button while submitting", () => {
    mockFormSubscribeState = { canSubmit: false, isSubmitting: true };
    render(<SignupForm />);
    const button = screen.getByRole("button", {
      name: /get the free newsletter/i,
    });
    expect(button).toBeDefined();
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("shows error message on mutation failure", () => {
    render(<SignupForm />);
    act(() => capturedOnError?.());
    const errorEl = screen.getByRole("alert");
    expect(errorEl).toBeDefined();
    expect(errorEl.textContent).toContain("Something went wrong");
  });
});
