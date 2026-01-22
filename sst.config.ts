/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "gemhog",
      removal: input.stage === "prod" ? "retain" : "remove",
      protect: ["prod"].includes(input.stage),
      home: "aws",
      providers: {
        aws: { region: "eu-central-1" },
        cloudflare: true,
      },
    };
  },
  async run() {
    // Dynamic imports for infra modules
    // These modules are imported for side effects (registering SST resources)
    const _secrets = await import("./infra/secrets");
    const _neon = await import("./infra/neon");
    const api = await import("./infra/api");
    const web = await import("./infra/web");

    // Collect and return outputs
    return {
      ...(api.outputs || {}),
      ...(web.outputs || {}),
    };
  },
});
