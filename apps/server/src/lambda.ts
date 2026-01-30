import { isSstDev } from "@gemhog/env/runtime";
import { handle, streamHandle } from "hono/aws-lambda";
import { app } from "./app";

// Conditional handler: streaming not supported in sst dev
// SST_DEV is set when running `sst dev` for local Lambda emulation
// Production Lambda uses streamHandle for AI streaming responses
export const handler = isSstDev ? handle(app) : streamHandle(app);
