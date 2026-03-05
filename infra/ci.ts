/**
 * Prerequisites (must be done in EACH AWS account — prod and dev use separate accounts):
 * 1. Create `gemhog/cloudflare-api-token` in AWS Secrets Manager.
 * 2. Create a GitHub CodeConnection named `gemhog-github` and approve OAuth.
 * 3. Run: sst secret set GithubConnectionArn <arn> --stage <stage>
 *    Get ARN with: aws codestar-connections list-connections --region eu-central-1 \
 *      --query "Connections[?ConnectionName=='gemhog-github'].ConnectionArn" --output text
 */

import { secrets } from "./secrets";

const GITHUB_REPO = "https://github.com/pauljasperdev/gemhog";

if ($app.stage === "prod" || $app.stage === "dev") {
  const isProd = $app.stage === "prod";
  const stage = $app.stage as "prod" | "dev";
  const connectionArn = secrets.GithubConnectionArn.value;
  const branchPattern = isProd ? "^refs/heads/main$" : "^refs/heads/dev$";
  const projectName = isProd ? "gemhog-deploy-prod" : "gemhog-deploy-dev";
  const logGroupName = `/aws/codebuild/${projectName}`;

  // Single IAM role per account
  const codebuildRole = new aws.iam.Role("GemhogCodebuildRole", {
    name: "gemhog-codebuild-role",
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            Service: "codebuild.amazonaws.com",
          },
          Action: "sts:AssumeRole",
        },
      ],
    }),
  });

  new aws.iam.RolePolicy("GemhogCodebuildRolePolicy", {
    role: codebuildRole.id,
    policy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "SSTStateBucket",
          Effect: "Allow",
          Action: [
            "s3:ListBucket",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetBucketLocation",
          ],
          Resource: ["arn:aws:s3:::sst-state-*", "arn:aws:s3:::sst-state-*/*"],
        },
        {
          Sid: "SSTAssetBucket",
          Effect: "Allow",
          Action: [
            "s3:ListBucket",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:GetBucketLocation",
          ],
          Resource: ["arn:aws:s3:::sst-asset-*", "arn:aws:s3:::sst-asset-*/*"],
        },
        {
          Sid: "SSTBootstrapSSM",
          Effect: "Allow",
          Action: ["ssm:GetParameters", "ssm:PutParameter"],
          Resource: [
            "arn:aws:ssm:eu-central-1:*:parameter/sst/passphrase/*",
            "arn:aws:ssm:eu-central-1:*:parameter/sst/bootstrap",
          ],
        },
        {
          Sid: "SSTSecrets",
          Effect: "Allow",
          Action: [
            "ssm:DeleteParameter",
            "ssm:GetParameter",
            "ssm:GetParameters",
            "ssm:GetParametersByPath",
            "ssm:PutParameter",
            "ssm:AddTagsToResource",
            "ssm:ListTagsForResource",
          ],
          Resource: ["arn:aws:ssm:eu-central-1:*:parameter/sst/*"],
        },
        {
          Sid: "ECR",
          Effect: "Allow",
          Action: [
            "ecr:CreateRepository",
            "ecr:DescribeRepositories",
            "ecr:GetAuthorizationToken",
            "ecr:BatchCheckLayerAvailability",
            "ecr:GetDownloadUrlForLayer",
            "ecr:BatchGetImage",
            "ecr:PutImage",
            "ecr:InitiateLayerUpload",
            "ecr:UploadLayerPart",
            "ecr:CompleteLayerUpload",
          ],
          Resource: ["*"],
        },
        {
          Sid: "CodeConnections",
          Effect: "Allow",
          Action: [
            "codeconnections:GetConnectionToken",
            "codeconnections:GetConnection",
            "codestar-connections:GetConnectionToken",
            "codestar-connections:GetConnection",
            "codestar-connections:UseConnection",
          ],
          Resource: ["*"],
        },
        {
          Sid: "SecretsManager",
          Effect: "Allow",
          Action: ["secretsmanager:GetSecretValue"],
          Resource: ["arn:aws:secretsmanager:eu-central-1:*:secret:gemhog/*"],
        },
        {
          Sid: "CloudWatchLogs",
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
          ],
          Resource: ["arn:aws:logs:eu-central-1:*:log-group:/aws/codebuild/*"],
        },
        {
          Sid: "Deployments",
          Effect: "Allow",
          Action: ["*"],
          Resource: ["*"],
        },
      ],
    }),
  });

  function buildspec(stage: "prod" | "dev"): string {
    return `version: 0.2
env:
  secrets-manager:
    CLOUDFLARE_API_TOKEN: "gemhog/cloudflare-api-token"
    CLOUDFLARE_DEFAULT_ACCOUNT_ID: "gemhog/cloudflare-default-account-id"
    DATABASE_URL: "gemhog/${stage}/database-url"
phases:
  install:
    runtime-versions:
      nodejs: 22
    commands:
      - npm install -g pnpm@10.15.1
  pre_build:
    commands:
      - pnpm install --frozen-lockfile
  build:
    commands:
      - pnpm sst deploy --stage ${stage} || (echo "SST deploy failed" && exit 1)
      - pnpm --filter @gemhog/db db:migrate`;
  }

  // Single project per account
  const project = new aws.codebuild.Project("GemhogDeploy", {
    name: projectName,
    description: `Deploys gemhog ${stage} environment from ${isProd ? "main" : "dev"} branch pushes.`,
    serviceRole: codebuildRole.arn,
    buildTimeout: 30,
    concurrentBuildLimit: 1,
    source: {
      type: "GITHUB",
      location: GITHUB_REPO,
      buildspec: buildspec(stage),
      auth: {
        type: "CODECONNECTIONS",
        resource: connectionArn,
      },
    },
    environment: {
      computeType: "BUILD_GENERAL1_MEDIUM",
      image: "aws/codebuild/standard:7.0",
      type: "LINUX_CONTAINER",
      environmentVariables: [],
    },
    artifacts: { type: "NO_ARTIFACTS" },
    logsConfig: {
      cloudwatchLogs: {
        status: "ENABLED",
        groupName: logGroupName,
      },
    },
  });

  // Single webhook per account
  new aws.codebuild.Webhook("GemhogWebhook", {
    projectName: project.name,
    buildType: "BUILD",
    filterGroups: [
      {
        filters: [
          { type: "EVENT", pattern: "PUSH" },
          { type: "HEAD_REF", pattern: branchPattern },
        ],
      },
    ],
  });

  // Email notifications for build failures
  const notificationTopic = new aws.sns.Topic("GemhogCodebuildNotifications", {
    name: `gemhog-codebuild-notifications-${stage}`,
  });

  new aws.sns.TopicPolicy("GemhogCodebuildNotificationsPolicy", {
    arn: notificationTopic.arn,
    policy: notificationTopic.arn.apply((arn) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AllowCodeStarNotifications",
            Effect: "Allow",
            Principal: { Service: "codestar-notifications.amazonaws.com" },
            Action: "sns:Publish",
            Resource: arn,
          },
        ],
      }),
    ),
  });

  // Requires email confirmation on first deploy — check your inbox
  new aws.sns.TopicSubscription("GemhogCodebuildEmailSubscription", {
    topic: notificationTopic.arn,
    protocol: "email",
    endpoint: secrets.AdminEmail.value,
  });

  new aws.codestarnotifications.NotificationRule(
    "GemhogCodebuildNotificationRule",
    {
      name: `gemhog-deploy-${stage}-notifications`,
      resource: project.arn,
      detailType: "BASIC",
      eventTypeIds: [
        "codebuild-project-build-state-failed",
        "codebuild-project-build-state-stopped",
      ],
      targets: [{ address: notificationTopic.arn }],
    },
  );
}
