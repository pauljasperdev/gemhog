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
          profile: process.env.CODEBUILD_BUILD_ID
            ? undefined
            : input.stage === "prod"
              ? "gemhog.prod"
              : "gemhog.dev",
        },
        cloudflare: true,
      },
    };
  },
  async run() {
    await import("./infra/secrets");
    await import("./infra/sql");
    // we dont need the api right now
    // const api = await import("./infra/api");
    const bucket = await import("./infra/bucket");
    const web = await import("./infra/web");
    await import("./infra/cron");
    await import("./infra/ci");
    return {
      // ...(api.outputs || {}),
      ...(bucket.outputs || {}),
      ...(web.outputs || {}),
    };
  },
});
