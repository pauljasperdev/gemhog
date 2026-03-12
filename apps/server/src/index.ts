import type { APIGatewayProxyEventV2, LambdaContext } from "@effect-aws/lambda";
import { LambdaHandler } from "@effect-aws/lambda";
import { Effect } from "effect";
import { ServerLive } from "./layer";

const effectHandler = (
  _event: APIGatewayProxyEventV2,
  _context: LambdaContext,
) => Effect.succeed({ statusCode: 200, body: "OK" });

export const handler = LambdaHandler.make({
  handler: effectHandler,
  layer: ServerLive,
});
