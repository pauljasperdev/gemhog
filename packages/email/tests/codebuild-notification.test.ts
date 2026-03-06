import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import type { CodeBuildAlert } from "../src/codebuild";
import {
  CodeBuildNotificationSchema,
  normalizeCodeBuildNotification,
  parseCodeBuildNotificationJson,
} from "../src/codebuild";
import { CodeBuildNotificationParseError } from "../src/errors";
import { codeBuildAlertEmail } from "../src/templates";
import fixturePayload from "./fixtures/codebuild-build-state-change.failed.json";

describe("CodeBuild notification parser", () => {
  it("parses the failed build fixture", async () => {
    const result = await Effect.runPromise(
      parseCodeBuildNotificationJson(JSON.stringify(fixturePayload)),
    );

    expect(result.detail["project-name"]).toBe("gemhog-deploy-dev");
    expect(result.detail["build-status"]).toBe("FAILED");
    expect(result.detail["additional-information"].logs["deep-link"]).toContain(
      "https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1",
    );
  });

  it("fails with CodeBuildNotificationParseError for malformed payload", async () => {
    const malformedJson = '{"invalid": json}';

    const result = await Effect.runPromise(
      Effect.either(parseCodeBuildNotificationJson(malformedJson)),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(CodeBuildNotificationParseError);
      expect(result.left.message).toContain("Failed to parse CodeBuild");
    }
  });

  it("fails with CodeBuildNotificationParseError for missing required fields", async () => {
    const incompleteJson = JSON.stringify({
      account: "123456789",
      // missing other required fields
    });

    const result = await Effect.runPromise(
      Effect.either(parseCodeBuildNotificationJson(incompleteJson)),
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left).toBeInstanceOf(CodeBuildNotificationParseError);
    }
  });
});

describe("normalizeCodeBuildNotification", () => {
  it("normalizes failed phase and reason from the fixture", () => {
    const parsed = Schema.decodeSync(CodeBuildNotificationSchema)(
      fixturePayload,
    );
    const alert = normalizeCodeBuildNotification(parsed);

    expect(alert.failurePhase).toBe("PRE_BUILD");
    expect(alert.failureReason).toContain("pnpm install --frozen-lockfile");
    expect(alert.projectName).toBe("gemhog-deploy-dev");
    expect(alert.status).toBe("FAILED");
    expect(alert.buildNumber).toBe(10);
    expect(alert.region).toBe("eu-central-1");
    expect(alert.account).toBe("379995600607");
    expect(alert.logsUrl).toContain(
      "https://console.aws.amazon.com/cloudwatch/",
    );
  });

  it("handles missing optional metadata without throwing", () => {
    const minimalPayload = {
      account: "123456789",
      detailType: "CodeBuild Build State Change",
      region: "us-east-1",
      source: "aws.codebuild",
      time: "2026-03-05T20:58:07Z",
      notificationRuleArn:
        "arn:aws:codestar-notifications:us-east-1:123456789:notificationrule/test",
      detail: {
        "build-status": "FAILED",
        "project-name": "test-project",
        "build-id": "arn:aws:codebuild:us-east-1:123456789:build/test",
        "additional-information": {
          cache: { type: "NO_CACHE" },
          "build-number": 1,
          "timeout-in-minutes": 30,
          "build-complete": true,
          initiator: "manual",
          "build-start-time": "Mar 5, 2026 8:57:06 PM",
          source: {
            "report-build-status": false,
            auth: {
              resource:
                "arn:aws:codeconnections:us-east-1:123456789:connection/test",
              type: "CODECONNECTIONS",
            },
            location: "https://github.com/test/repo",
            "git-clone-depth": 0,
            type: "GITHUB",
          },
          "source-version": "abc123",
          artifact: { location: "" },
          environment: {
            image: "aws/codebuild/standard:7.0",
            "privileged-mode": false,
            "image-pull-credentials-type": "CODEBUILD",
            "compute-type": "BUILD_GENERAL1_SMALL",
            type: "LINUX_CONTAINER",
            "environment-variables": [],
          },
          logs: {
            "group-name": "/aws/codebuild/test",
            "stream-name": "test-stream",
            "deep-link":
              "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1",
          },
          phases: [],
          "queued-timeout-in-minutes": 480,
        },
        "current-phase": "COMPLETED",
        "current-phase-context": "[: ]",
        version: "1",
      },
      resources: ["arn:aws:codebuild:us-east-1:123456789:build/test"],
      additionalAttributes: {},
    };

    // biome-ignore lint/suspicious/noExplicitAny: Testing minimal payload without all required fields
    const alert = normalizeCodeBuildNotification(minimalPayload as any);

    expect(alert.failurePhase).toBeNull();
    expect(alert.failureReason).toBeNull();
    expect(alert.projectName).toBe("test-project");
    expect(alert.status).toBe("FAILED");
  });
});

const makeFixtureAlert = (): CodeBuildAlert => ({
  projectName: "gemhog-deploy-dev",
  status: "FAILED",
  buildId:
    "arn:aws:codebuild:eu-central-1:379995600607:build/gemhog-deploy-dev:76b1e04c-9920-41c7-8a7d-bc75b8bd516b",
  buildNumber: 10,
  sourceVersion: "b021fab27c008bc900814799ce75f47de7538cdf",
  initiator: "GitHub-Hookshot/1cdf727",
  startedAt: "Mar 5, 2026 8:57:06 PM",
  currentPhase: "COMPLETED",
  failurePhase: "PRE_BUILD",
  failureReason:
    "COMMAND_EXECUTION_ERROR: Error while executing command: pnpm install --frozen-lockfile. Reason: exit status 1",
  logsUrl:
    "https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#logsV2:log-groups/log-group/test",
  environmentImage: "aws/codebuild/standard:7.0",
  computeType: "BUILD_GENERAL1_MEDIUM",
  region: "eu-central-1",
  account: "379995600607",
});

describe("codeBuildAlertEmail", () => {
  it("renders a readable failed build email", async () => {
    const alert = makeFixtureAlert();
    const result = await codeBuildAlertEmail(alert);

    expect(result.subject).toContain("gemhog-deploy-dev");
    expect(result.subject).toContain("FAILED");
    expect(result.html).toContain("COMMAND_EXECUTION_ERROR");
    expect(result.html).toContain(
      "https://console.aws.amazon.com/cloudwatch/home?region=eu-central-1#logsV2",
    );
    expect(result.html).toContain("gemhog-deploy-dev");
  });

  it("does not include the raw notification JSON in the rendered email", async () => {
    const alert = makeFixtureAlert();
    const result = await codeBuildAlertEmail(alert);

    expect(result.html).not.toContain("additional-information");
    expect(result.html).not.toContain("phase-context");
  });
});
