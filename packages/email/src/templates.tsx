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
import type { CodeBuildAlert } from "./codebuild";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const colors = {
  bg: "#F5F5F0",
  card: "#FFFFFF",
  border: "#C8C4BB",
  foreground: "#1C1C1C",
  muted: "#555555",
  primary: "#0D9488",
  primaryFg: "#FFFFFF",
};

const fontStack =
  "-apple-system, system-ui, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";

function VerificationEmailTemplate({ verifyUrl }: { verifyUrl: string }) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>
        Thanks for signing up for Gemhog. Please confirm your email.
      </Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "light",
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
              Thanks for signing up! Please confirm your email address to get
              early access.
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
              Confirm my spot
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
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>
        You've been successfully unsubscribed from Gemhog emails.
      </Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "light",
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
    subject: "Confirm your spot on the Gemhog waitlist",
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
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>Use this code to sign in to Gemhog.</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "light",
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

function CodeBuildAlertEmailTemplate({ alert }: { alert: CodeBuildAlert }) {
  const statusColor =
    alert.status === "FAILED"
      ? "#DC2626"
      : alert.status === "STOPPED"
        ? "#D97706"
        : colors.primary;

  const buildUuid = alert.buildId.split(":").pop() ?? alert.buildId;
  const shortBuildId = `${alert.projectName}:${buildUuid.slice(0, 8)}`;
  const shortCommit = alert.sourceVersion.slice(0, 8);

  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{`Build ${alert.status}: ${alert.projectName}`}</Preview>
      <Body
        style={{
          backgroundColor: colors.bg,
          colorScheme: "light",
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
              borderLeft: `2px solid ${statusColor}`,
            }}
          >
            <Heading
              style={{
                color: statusColor,
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 8px",
              }}
            >
              {`Build ${alert.status}`}
            </Heading>
            <Text
              style={{
                color: colors.foreground,
                fontSize: "16px",
                fontWeight: "600",
                margin: "0 0 24px",
              }}
            >
              {alert.projectName}
            </Text>

            {(alert.failurePhase ?? alert.failureReason) && (
              <Section
                style={{
                  backgroundColor: "#FEF2F2",
                  borderLeft: "3px solid #DC2626",
                  padding: "12px 16px",
                  marginBottom: "24px",
                }}
              >
                {alert.failurePhase && (
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: "13px",
                      fontWeight: "600",
                      margin: "0 0 4px",
                    }}
                  >
                    {`Phase: ${alert.failurePhase}`}
                  </Text>
                )}
                {alert.failureReason && (
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: "13px",
                      lineHeight: "1.5",
                      margin: "0",
                      wordBreak: "break-word",
                    }}
                  >
                    {`Reason: ${alert.failureReason}`}
                  </Text>
                )}
              </Section>
            )}

            <Section style={{ marginBottom: "24px" }}>
              {[
                { label: "Build #", value: String(alert.buildNumber) },
                { label: "Build ID", value: shortBuildId },
                { label: "Initiator", value: alert.initiator },
                { label: "Commit", value: shortCommit },
                { label: "Started at", value: alert.startedAt },
                { label: "Phase", value: alert.currentPhase },
              ].map(({ label, value }) => (
                <Section
                  key={label}
                  style={{
                    borderBottom: `1px solid ${colors.border}`,
                    paddingTop: "8px",
                    paddingBottom: "8px",
                  }}
                >
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      margin: "0 0 2px",
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: "14px",
                      margin: "0",
                      fontFamily: "'Courier New', monospace",
                    }}
                  >
                    {value}
                  </Text>
                </Section>
              ))}
              <Section
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                }}
              >
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: "12px",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    margin: "0 0 2px",
                  }}
                >
                  Environment
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: "14px",
                    margin: "0",
                    fontFamily: "'Courier New', monospace",
                  }}
                >
                  {`${alert.environmentImage} · ${alert.computeType}`}
                </Text>
              </Section>
            </Section>

            <Button
              href={alert.logsUrl}
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
              View Logs
            </Button>
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

export async function codeBuildAlertEmail(
  alert: CodeBuildAlert,
): Promise<EmailContent> {
  const html = await render(<CodeBuildAlertEmailTemplate alert={alert} />);
  const text = await render(<CodeBuildAlertEmailTemplate alert={alert} />, {
    plainText: true,
  });
  return {
    subject: `[${alert.status}] ${alert.projectName} — CodeBuild Build`,
    html,
    text,
  };
}
