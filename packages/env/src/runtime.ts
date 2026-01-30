const isTruthy = (value: string | undefined) =>
  value === "1" || value === "true";

export const nodeEnv = process.env.NODE_ENV ?? "development";
export const isDev = nodeEnv === "development";
export const isProd = nodeEnv === "production";
export const isTest = nodeEnv === "test";

export const nextRuntime = process.env.NEXT_RUNTIME;
export const isSstDev = isTruthy(process.env.SST_DEV);
export const isCi = isTruthy(process.env.CI);
export const codebuildBuildId = process.env.CODEBUILD_BUILD_ID;
