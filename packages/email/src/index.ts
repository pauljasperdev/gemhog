export { EmailSendError } from "./email.errors";
export {
  EmailService,
  EmailServiceConsole,
  EmailServiceLive,
  type SendEmailParams,
} from "./email.service";
export {
  type EmailContent,
  unsubscribeConfirmationEmail,
  verificationEmail,
} from "./email.templates";
