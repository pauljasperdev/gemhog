import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({});

export async function handler() {
  const dailyFunctionName = process.env.SYNC_DAILY_FUNCTION_NAME;
  const weeklyFunctionName = process.env.SYNC_WEEKLY_FUNCTION_NAME;

  if (!dailyFunctionName || !weeklyFunctionName) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Missing required environment variables",
        details: {
          dailyMissing: !dailyFunctionName,
          weeklyMissing: !weeklyFunctionName,
        },
      }),
    };
  }

  let dailyResult: {
    status: string;
    statusCode?: number;
    error?: string;
    payload?: unknown;
  };
  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: dailyFunctionName,
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
      dailyResult = {
        status: "rejected",
        statusCode: result.StatusCode,
        error: result.FunctionError,
        payload,
      };
    } else {
      dailyResult = {
        status: "fulfilled",
        statusCode: result.StatusCode,
        payload,
      };
    }
  } catch (error) {
    dailyResult = {
      status: "rejected",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let weeklyResult: {
    status: string;
    statusCode?: number;
    error?: string;
    payload?: unknown;
  };
  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: weeklyFunctionName,
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
      weeklyResult = {
        status: "rejected",
        statusCode: result.StatusCode,
        error: result.FunctionError,
        payload,
      };
    } else {
      weeklyResult = {
        status: "fulfilled",
        statusCode: result.StatusCode,
        payload,
      };
    }
  } catch (error) {
    weeklyResult = {
      status: "rejected",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const overallStatusCode =
    dailyResult.status === "rejected" || weeklyResult.status === "rejected"
      ? 500
      : 200;

  return {
    statusCode: overallStatusCode,
    body: JSON.stringify({
      message: "Sync triggered",
      daily: {
        function: dailyFunctionName,
        ...dailyResult,
      },
      weekly: {
        function: weeklyFunctionName,
        ...weeklyResult,
      },
    }),
  };
}
