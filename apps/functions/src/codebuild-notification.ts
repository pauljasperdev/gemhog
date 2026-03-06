import "@gemhog/env/server";

import type { LambdaContext, SNSEvent } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import {
  codeBuildAlertEmail,
  EmailService,
  EmailServiceLayer,
  normalizeCodeBuildNotification,
  parseCodeBuildNotificationJson,
} from "@gemhog/email";
import { Config, Console, Effect } from "effect";

type SNSEventRecord = SNSEvent["Records"][number];

/**
 * SNS Lambda handler for CodeBuild build-state-change notifications.
 * Sends one email per Notification record to ADMIN_EMAIL.
 * Non-Notification records are skipped (logged). Parse/send failures throw.
 */
export const effectHandler = (event: SNSEvent, _context: LambdaContext) =>
  Effect.gen(function* () {
    const adminEmail = yield* Config.string("ADMIN_EMAIL");
    const service = yield* EmailService;

    yield* Effect.forEach(
      event.Records,
      (record: SNSEventRecord) =>
        Effect.gen(function* () {
          if (record.Sns.Type !== "Notification") {
            yield* Console.info(
              `Skipping SNS record of type "${record.Sns.Type}" — expected "Notification"`,
            );
            return;
          }

          const notification = yield* parseCodeBuildNotificationJson(
            record.Sns.Message,
          );
          const alert = normalizeCodeBuildNotification(notification);
          const emailContent = yield* Effect.promise(() =>
            codeBuildAlertEmail(alert),
          );
          yield* service.send(adminEmail, emailContent);
        }),
      { discard: true },
    );
  }).pipe(Effect.orDie);

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: EmailServiceLayer,
});
