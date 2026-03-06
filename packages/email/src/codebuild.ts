import { Effect, Schema } from "effect";
import { CodeBuildNotificationParseError } from "./errors";

const CodeBuildPhase = Schema.Struct({
  "phase-type": Schema.String,
  "phase-status": Schema.optional(Schema.String),
  "phase-context": Schema.optional(Schema.Array(Schema.String)),
  "start-time": Schema.String,
  "end-time": Schema.optional(Schema.String),
  "duration-in-seconds": Schema.optional(Schema.Number),
});

const CodeBuildEnvironment = Schema.Struct({
  image: Schema.String,
  "privileged-mode": Schema.Boolean,
  "image-pull-credentials-type": Schema.String,
  "compute-type": Schema.String,
  type: Schema.String,
  "environment-variables": Schema.Array(Schema.Unknown),
});

const CodeBuildLogs = Schema.Struct({
  "group-name": Schema.String,
  "stream-name": Schema.String,
  "deep-link": Schema.String,
});

const CodeBuildSource = Schema.Struct({
  "report-build-status": Schema.Boolean,
  auth: Schema.Struct({
    resource: Schema.String,
    type: Schema.String,
  }),
  location: Schema.String,
  "git-clone-depth": Schema.Number,
  type: Schema.String,
});

const CodeBuildCache = Schema.Struct({
  type: Schema.String,
});

const CodeBuildArtifact = Schema.Struct({
  location: Schema.String,
});

const CodeBuildAdditionalInformation = Schema.Struct({
  cache: CodeBuildCache,
  "build-number": Schema.Number,
  "timeout-in-minutes": Schema.Number,
  "build-complete": Schema.Boolean,
  initiator: Schema.String,
  "build-start-time": Schema.String,
  source: CodeBuildSource,
  "source-version": Schema.String,
  artifact: CodeBuildArtifact,
  environment: CodeBuildEnvironment,
  logs: CodeBuildLogs,
  phases: Schema.Array(CodeBuildPhase),
  "queued-timeout-in-minutes": Schema.Number,
});

const CodeBuildDetail = Schema.Struct({
  "build-status": Schema.String,
  "project-name": Schema.String,
  "build-id": Schema.String,
  "additional-information": CodeBuildAdditionalInformation,
  "current-phase": Schema.String,
  "current-phase-context": Schema.String,
  version: Schema.String,
});

export const CodeBuildNotificationSchema = Schema.Struct({
  account: Schema.String,
  detailType: Schema.String,
  region: Schema.String,
  source: Schema.String,
  time: Schema.String,
  notificationRuleArn: Schema.String,
  detail: CodeBuildDetail,
  resources: Schema.Array(Schema.String),
  additionalAttributes: Schema.Unknown,
});

export type CodeBuildNotification = Schema.Schema.Type<
  typeof CodeBuildNotificationSchema
>;

/**
 * Normalized CodeBuild alert model for email presentation.
 * Derived from CodeBuildNotification with extracted failure details.
 */
export interface CodeBuildAlert {
  projectName: string;
  status: "FAILED" | "STOPPED";
  buildId: string;
  buildNumber: number;
  sourceVersion: string;
  initiator: string;
  startedAt: string;
  currentPhase: string;
  failurePhase: string | null;
  failureReason: string | null;
  logsUrl: string;
  environmentImage: string;
  computeType: string;
  region: string;
  account: string;
}

/**
 * Normalize a CodeBuildNotification into a compact CodeBuildAlert.
 * Extracts failure phase and reason from the phases array.
 * Pure synchronous function (operates on already-decoded notification).
 */
export const normalizeCodeBuildNotification = (
  notification: CodeBuildNotification,
): CodeBuildAlert => {
  const detail = notification.detail;
  const additionalInfo = detail["additional-information"];
  const phases = additionalInfo.phases ?? [];

  let failurePhase: string | null = null;
  let failureReason: string | null = null;

  for (const phase of phases) {
    if (phase["phase-status"] === "FAILED") {
      failurePhase = phase["phase-type"];
      const phaseContext = phase["phase-context"] ?? [];
      for (const context of phaseContext) {
        if (context?.trim()) {
          failureReason = context;
          break;
        }
      }
      break;
    }
  }

  if (!failureReason && detail["current-phase-context"]) {
    const stripped = detail["current-phase-context"]
      .replace(/^\[\s*:\s*\]$/, "")
      .trim();
    failureReason = stripped || null;
  }

  return {
    projectName: detail["project-name"],
    status: detail["build-status"] as "FAILED" | "STOPPED",
    buildId: detail["build-id"],
    buildNumber: additionalInfo["build-number"],
    sourceVersion: additionalInfo["source-version"],
    initiator: additionalInfo.initiator,
    startedAt: additionalInfo["build-start-time"],
    currentPhase: detail["current-phase"],
    failurePhase,
    failureReason,
    logsUrl: additionalInfo.logs["deep-link"],
    environmentImage: additionalInfo.environment.image,
    computeType: additionalInfo.environment["compute-type"],
    region: notification.region,
    account: notification.account,
  };
};

/**
 * Parse a CodeBuild notification JSON string into a typed CodeBuildNotification.
 * Converts both JSON parse errors and schema validation errors into CodeBuildNotificationParseError.
 */
export const parseCodeBuildNotificationJson = (
  message: string,
): Effect.Effect<CodeBuildNotification, CodeBuildNotificationParseError> =>
  Schema.decodeUnknown(Schema.parseJson(CodeBuildNotificationSchema))(
    message,
  ).pipe(
    Effect.mapError(
      (error) =>
        new CodeBuildNotificationParseError({
          message: `Failed to parse CodeBuild notification: ${String(error)}`,
          cause: error,
        }),
    ),
  );
