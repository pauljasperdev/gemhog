export {
  type CodeBuildAlert,
  type CodeBuildNotification,
  normalizeCodeBuildNotification,
  parseCodeBuildNotificationJson,
} from "./codebuild";
export { EmailServiceConsole } from "./console";
export { EmailSendError } from "./errors";
export { EmailServiceLayer } from "./layer";
export { EmailServiceLive } from "./resend";
export { EmailService } from "./service";
export {
  codeBuildAlertEmail,
  type EmailContent,
  signInOtpEmail,
  unsubscribeConfirmationEmail,
  verificationEmail,
} from "./templates";
