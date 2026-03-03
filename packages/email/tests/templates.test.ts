import { beforeAll, describe, expect, it } from "vitest";
import {
  signInOtpEmail,
  unsubscribeConfirmationEmail,
  verificationEmail,
} from "../src/templates";

describe("email templates", () => {
  describe("verificationEmail", () => {
    const verifyUrl = "https://gemhog.com/api/email/verify?token=abc123";
    let result: Awaited<ReturnType<typeof verificationEmail>>;

    beforeAll(async () => {
      result = await verificationEmail({ verifyUrl });
    });

    it("returns subject containing 'Confirm'", () => {
      expect(result.subject).toContain("Confirm");
    });

    it("HTML contains the verifyUrl", () => {
      expect(result.html).toContain(verifyUrl);
    });

    it("HTML contains a confirm button/link", () => {
      expect(result.html).toContain(`href="${verifyUrl}"`);
      expect(result.html).toContain("Confirm my spot");
    });

    it("HTML contains 7-day expiry notice", () => {
      expect(result.html).toContain("7 days");
    });

    it("HTML contains 'didn't subscribe' disclaimer", () => {
      expect(result.html).toContain("didn&#x27;t subscribe");
    });

    it("HTML contains footer text", () => {
      expect(result.html).toContain("Podcast Intelligence");
    });

    it("returns plain text version containing the verifyUrl", () => {
      expect(result.text).toBeDefined();
      expect(result.text).toContain(verifyUrl);
    });

    it("plain text version mentions 7-day expiry", () => {
      expect(result.text).toContain("7 days");
    });

    it("HTML contains light background color", () => {
      expect(result.html).toContain("#F5F5F0");
    });

    it("HTML contains primary teal brand color", () => {
      expect(result.html).toContain("#0D9488");
    });

    it("HTML contains color-scheme dark declaration", () => {
      expect(result.html).toContain("color-scheme");
    });
  });

  describe("unsubscribeConfirmationEmail", () => {
    let result: Awaited<ReturnType<typeof unsubscribeConfirmationEmail>>;

    beforeAll(async () => {
      result = await unsubscribeConfirmationEmail();
    });

    it("returns a valid subject", () => {
      expect(result.subject).toBeTruthy();
      expect(result.subject.length).toBeGreaterThan(0);
    });

    it("returns valid HTML", () => {
      expect(result.html).toContain("<!DOCTYPE html");
      expect(result.html).toContain("</html>");
    });

    it("HTML contains unsubscribe confirmation message", () => {
      expect(result.html).toContain("unsubscribed");
    });

    it("HTML contains link back to site", () => {
      expect(result.html).toContain("gemhog.com");
    });

    it("returns plain text version with unsubscribe confirmation", () => {
      expect(result.text).toBeDefined();
      expect(result.text).toContain("unsubscribed");
    });

    it("plain text version contains resubscribe info", () => {
      expect(result.text).toContain("gemhog.com");
    });

    it("HTML contains light background color", () => {
      expect(result.html).toContain("#F5F5F0");
    });

    it("HTML contains primary teal brand color", () => {
      expect(result.html).toContain("#0D9488");
    });

    it("HTML contains color-scheme dark declaration", () => {
      expect(result.html).toContain("color-scheme");
    });
  });

  describe("signInOtpEmail", () => {
    let result: Awaited<ReturnType<typeof signInOtpEmail>>;

    beforeAll(async () => {
      result = await signInOtpEmail({ otp: "123456" });
    });

    it("subject does not contain 'admin' (case-insensitive)", () => {
      expect(result.subject.toLowerCase()).not.toContain("admin");
    });

    it("HTML does not contain 'admin panel' (case-insensitive)", () => {
      expect(result.html.toLowerCase()).not.toContain("admin panel");
    });
  });
});
