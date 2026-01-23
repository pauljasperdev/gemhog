/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gemhog",
      removal: input.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input.stage),
      home: "aws",
      providers: {
        aws: {
          region: "eu-central-1",
          profile: input.stage === "prod" ? "gemhog.prod" : "gemhog.dev",
        },
        cloudflare: true,
      },
    };
  },
  async run() {
    const _secrets = await import("./infra/secrets");
    const _neon = await import("./infra/neon");
    const api = await import("./infra/api");
    const web = await import("./infra/web");

    return {
      ...(api.outputs || {}),
      ...(web.outputs || {}),
    };
  },
  console: {
    autodeploy: {
      target(event) {
        if (
          event.type === "branch" &&
          event.branch === "main" &&
          event.action === "pushed"
        ) {
          return { stage: "prod" };
        }
        if (event.type === "branch" && event.action === "pushed") {
          return {
            stage: event.branch
              .replace(/[^a-zA-Z0-9-]/g, "-")
              .replace(/-+/g, "-")
              .replace(/^-/g, "")
              .replace(/-$/g, ""),
          };
        }
        if (event.type === "pull_request") {
          return { stage: `pr-${event.number}` };
        }
      },
      async workflow({ $, event }) {
        await $`npm install -g pnpm`;
        await $`pnpm install`;
        if (event.action === "removed") {
          await $`pnpm sst remove`;
        } else {
          await $`pnpm sst deploy`;
          await $`pnpm db:migrate`;
        }
      },
    },
  },
});
