export { EmailSendError } from "./errors";
export {
  EmailService,
  EmailServiceConsole,
  EmailServiceLive,
  type SendEmailParams,
} from "./service";
export {
  type EmailContent,
  unsubscribeConfirmationEmail,
  verificationEmail,
} from "./templates";
