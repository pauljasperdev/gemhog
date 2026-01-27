interface EmailContent {
  subject: string;
  html: string;
}

export function verificationEmail(params: { verifyUrl: string }): EmailContent {
  return {
    subject: "Confirm your Gemhog subscription",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f9fafb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5e7eb;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Welcome to Gemhog</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#374151;">
            Thanks for signing up! Please confirm your email address to start receiving expert investment insights.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td align="center" style="background-color:#2563eb;border-radius:6px;">
              <a href="${params.verifyUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;">Confirm subscription</a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:14px;line-height:1.5;color:#6b7280;">
            This link expires in 7 days. If you didn't sign up for Gemhog, you can safely ignore this email.
          </p>
          <!-- CAN-SPAM footer placeholder -->
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}

export function unsubscribeConfirmationEmail(): EmailContent {
  return {
    subject: "You've been unsubscribed from Gemhog",
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f9fafb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;padding:40px;border:1px solid #e5e7eb;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-size:24px;color:#111827;">Unsubscribed</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#374151;">
            You've been successfully unsubscribed from Gemhog emails. We're sorry to see you go.
          </p>
          <p style="margin:0;font-size:14px;line-height:1.5;color:#6b7280;">
            Changed your mind? You can always resubscribe at <a href="https://gemhog.com" style="color:#2563eb;text-decoration:underline;">gemhog.com</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  };
}
