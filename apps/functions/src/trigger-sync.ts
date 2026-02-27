import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({});

export async function handler() {
  const backfillFunctionName = process.env.BACKFILL_FUNCTION_NAME;

  if (!backfillFunctionName) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing BACKFILL_FUNCTION_NAME environment variable",
      }),
    };
  }

  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: backfillFunctionName,
        InvocationType: "RequestResponse",
      }),
    );
    const rawPayload = result.Payload
      ? new TextDecoder().decode(result.Payload)
      : undefined;
    let payload: unknown;
    try {
      payload = rawPayload ? JSON.parse(rawPayload) : undefined;
    } catch {
      payload = rawPayload;
    }

    if (result.FunctionError) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Backfill failed",
          function: backfillFunctionName,
          status: "rejected",
          statusCode: result.StatusCode,
          error: result.FunctionError,
          payload,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Backfill triggered",
        function: backfillFunctionName,
        status: "fulfilled",
        statusCode: result.StatusCode,
        payload,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Backfill failed",
        function: backfillFunctionName,
        status: "rejected",
        error: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
