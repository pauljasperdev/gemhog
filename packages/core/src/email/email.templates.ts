export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export function verificationEmail(params: { verifyUrl: string }): EmailContent {
  return {
    subject: "Confirm your Gemhog subscription",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#000000;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;padding:40px;border:1px solid #27272a;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:24px;color:#fafafa;">Welcome to Gemhog</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#d4d4d8;">
            Thanks for signing up! Please confirm your email address to start receiving expert investment insights.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td align="center" style="background-color:#10b981;border-radius:9999px;">
              <a href="${params.verifyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Confirm subscription</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#a1a1aa;">
            This link expires in 7 days. If you didn't sign up for Gemhog, you can safely ignore this email.
          </p>
          <!-- CAN-SPAM footer placeholder -->
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Welcome to Gemhog\n\nThanks for signing up! Confirm your email: ${params.verifyUrl}\n\nThis link expires in 7 days.`,
  };
}

export function unsubscribeConfirmationEmail(): EmailContent {
  return {
    subject: "You've been unsubscribed from Gemhog",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#000000;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#18181b;border-radius:12px;padding:40px;border:1px solid #27272a;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:24px;color:#fafafa;">Unsubscribed</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#d4d4d8;">
            You've been successfully unsubscribed from Gemhog emails. We're sorry to see you go.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#a1a1aa;">
            Changed your mind? You can always resubscribe at <a href="https://gemhog.com" style="color:#10b981;text-decoration:underline;">gemhog.com</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: "Unsubscribed\n\nYou've been successfully unsubscribed from Gemhog emails.\n\nChanged your mind? Resubscribe at gemhog.com",
  };
}
