import { describe, expect, it } from "vitest";
import {
  unsubscribeConfirmationEmail,
  verificationEmail,
} from "./email.templates";

describe("email templates", () => {
  describe("verificationEmail", () => {
    const verifyUrl = "https://gemhog.com/api/email/verify?token=abc123";
    const result = verificationEmail({ verifyUrl });

    it("returns subject containing 'Confirm'", () => {
      expect(result.subject).toContain("Confirm");
    });

    it("HTML contains the verifyUrl", () => {
      expect(result.html).toContain(verifyUrl);
    });

    it("HTML contains a confirm button/link", () => {
      expect(result.html).toContain(`href="${verifyUrl}"`);
      expect(result.html).toContain("Confirm subscription");
    });

    it("HTML contains 7-day expiry notice", () => {
      expect(result.html).toContain("7 days");
    });

    it("HTML contains 'didn't sign up' disclaimer", () => {
      expect(result.html).toContain("didn't sign up");
    });

    it("HTML contains CAN-SPAM footer placeholder", () => {
      expect(result.html).toContain("CAN-SPAM footer placeholder");
    });
  });

  describe("unsubscribeConfirmationEmail", () => {
    const result = unsubscribeConfirmationEmail();

    it("returns a valid subject", () => {
      expect(result.subject).toBeTruthy();
      expect(result.subject.length).toBeGreaterThan(0);
    });

    it("returns valid HTML", () => {
      expect(result.html).toContain("<!DOCTYPE html>");
      expect(result.html).toContain("</html>");
    });

    it("HTML contains unsubscribe confirmation message", () => {
      expect(result.html).toContain("unsubscribed");
    });

    it("HTML contains link back to site", () => {
      expect(result.html).toContain("gemhog.com");
    });
  });
});
