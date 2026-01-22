import { handle, streamHandle } from "@hono/aws-lambda";
import { app } from "./app";

// Conditional handler: streaming not supported in sst dev
// SST_DEV is set when running `sst dev` for local Lambda emulation
// Production Lambda uses streamHandle for AI streaming responses
export const handler = process.env.SST_DEV ? handle(app) : streamHandle(app);
