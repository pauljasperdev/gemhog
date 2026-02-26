import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const colors = {
  bg: "#0a0a0a",
  card: "#111111",
  border: "#222222",
  foreground: "#e0e0e0",
  muted: "#888888",
  primary: "#c8ff00",
  primaryFg: "#0a0a0a",
};

const fontStack =
  "-apple-system, system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function VerificationEmailTemplate({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark only" />
        <meta name="supported-color-schemes" content="dark only" />
      </Head>
      <Preview>
        Thanks for subscribing to Gemhog. Please confirm your email.
      </Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "dark",
          margin: "0",
          padding: "0",
          fontFamily: fontStack,
        }}
      >
        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ marginBottom: "32px" }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0",
              }}
            >
              GEMHOG
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: colors.card,
              padding: "32px",
              borderLeft: `2px solid ${colors.primary}`,
            }}
          >
            <Heading
              style={{
                color: colors.foreground,
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 16px",
              }}
            >
              Welcome to Gemhog
            </Heading>
            <Text
              style={{
                color: colors.muted,
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 24px",
              }}
            >
              Thanks for subscribing! Please confirm your email address to start
              receiving expert investment insights.
            </Text>
            <Button
              href={verifyUrl}
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryFg,
                padding: "12px 32px",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
                letterSpacing: "0.05em",
              }}
            >
              Confirm subscription
            </Button>
          </Section>

          <Section style={{ marginTop: "24px" }}>
            <Text
              style={{
                color: colors.muted,
                fontSize: "13px",
                lineHeight: "1.5",
                margin: "0 0 8px",
              }}
            >
              This link expires in 7 days. If you didn't subscribe to Gemhog,
              you can safely ignore this email.
            </Text>
            {/* CAN-SPAM footer placeholder */}
          </Section>

          <Hr style={{ borderColor: colors.border, margin: "24px 0 16px" }} />
          <Text
            style={{
              color: colors.muted,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0",
            }}
          >
            Gemhog — Podcast Intelligence
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function UnsubscribeConfirmationEmailTemplate() {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark only" />
        <meta name="supported-color-schemes" content="dark only" />
      </Head>
      <Preview>
        You've been successfully unsubscribed from Gemhog emails.
      </Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "dark",
          margin: "0",
          padding: "0",
          fontFamily: fontStack,
        }}
      >
        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ marginBottom: "32px" }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0",
              }}
            >
              GEMHOG
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: colors.card,
              padding: "32px",
              borderLeft: `2px solid ${colors.primary}`,
            }}
          >
            <Heading
              style={{
                color: colors.foreground,
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 16px",
              }}
            >
              Unsubscribed
            </Heading>
            <Text
              style={{
                color: colors.muted,
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 24px",
              }}
            >
              You've been successfully unsubscribed from Gemhog emails.
            </Text>
            <Text
              style={{
                color: colors.muted,
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0",
              }}
            >
              Changed your mind? Resubscribe at{" "}
              <Link href="https://gemhog.com" style={{ color: colors.primary }}>
                gemhog.com
              </Link>
            </Text>
          </Section>

          <Hr style={{ borderColor: colors.border, margin: "24px 0 16px" }} />
          <Text
            style={{
              color: colors.muted,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0",
            }}
          >
            Gemhog — Podcast Intelligence
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function verificationEmail(params: {
  verifyUrl: string;
}): Promise<EmailContent> {
  const html = await render(
    <VerificationEmailTemplate verifyUrl={params.verifyUrl} />,
  );
  const text = await render(
    <VerificationEmailTemplate verifyUrl={params.verifyUrl} />,
    { plainText: true },
  );
  return {
    subject: "Confirm your Gemhog subscription",
    html,
    text,
  };
}

export async function unsubscribeConfirmationEmail(): Promise<EmailContent> {
  const html = await render(<UnsubscribeConfirmationEmailTemplate />);
  const text = await render(<UnsubscribeConfirmationEmailTemplate />, {
    plainText: true,
  });
  return {
    subject: "You've been unsubscribed from Gemhog",
    html,
    text,
  };
}

function SignInOtpEmailTemplate({ otp }: { otp: string }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="dark only" />
        <meta name="supported-color-schemes" content="dark only" />
      </Head>
      <Preview>Use this code to sign in to Gemhog.</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "dark",
          margin: "0",
          padding: "0",
          fontFamily: fontStack,
        }}
      >
        <Container
          style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}
        >
          <Section style={{ marginBottom: "32px" }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: "20px",
                fontWeight: "700",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: "0",
              }}
            >
              GEMHOG
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: colors.card,
              padding: "32px",
              borderLeft: `2px solid ${colors.primary}`,
            }}
          >
            <Heading
              style={{
                color: colors.foreground,
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 16px",
              }}
            >
              Your sign-in code
            </Heading>
            <Text
              style={{
                color: colors.muted,
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 24px",
              }}
            >
              Use this code to sign in to Gemhog.
            </Text>
            <Section
              style={{
                backgroundColor: colors.border,
                padding: "24px",
                borderRadius: "8px",
                marginBottom: "24px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: "32px",
                  fontWeight: "700",
                  letterSpacing: "0.1em",
                  margin: "0",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {otp}
              </Text>
            </Section>
            <Text
              style={{
                color: colors.muted,
                fontSize: "14px",
                lineHeight: "1.5",
                margin: "0",
              }}
            >
              This code expires in 5 minutes.
            </Text>
          </Section>

          <Hr style={{ borderColor: colors.border, margin: "24px 0 16px" }} />
          <Text
            style={{
              color: colors.muted,
              fontSize: "11px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0",
            }}
          >
            Gemhog — Podcast Intelligence
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export async function signInOtpEmail(params: {
  otp: string;
}): Promise<EmailContent> {
  const html = await render(<SignInOtpEmailTemplate otp={params.otp} />);
  const text = await render(<SignInOtpEmailTemplate otp={params.otp} />, {
    plainText: true,
  });
  return {
    subject: "Your Gemhog sign-in code",
    html,
    text,
  };
}
