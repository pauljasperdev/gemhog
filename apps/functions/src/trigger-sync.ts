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

  let dailyResult: { status: string; statusCode?: number; error?: string };
  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: dailyFunctionName,
        InvocationType: "RequestResponse",
      }),
    );
    dailyResult = { status: "fulfilled", statusCode: result.StatusCode };
  } catch (error) {
    dailyResult = {
      status: "rejected",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  let weeklyResult: { status: string; statusCode?: number; error?: string };
  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: weeklyFunctionName,
        InvocationType: "RequestResponse",
      }),
    );
    weeklyResult = { status: "fulfilled", statusCode: result.StatusCode };
  } catch (error) {
    weeklyResult = {
      status: "rejected",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Sync triggered",
      daily: {
        function: dailyFunctionName,
        statusCode: dailyResult.statusCode,
        status: dailyResult.status,
        ...(dailyResult.error !== undefined && { error: dailyResult.error }),
      },
      weekly: {
        function: weeklyFunctionName,
        statusCode: weeklyResult.statusCode,
        status: weeklyResult.status,
        ...(weeklyResult.error !== undefined && { error: weeklyResult.error }),
      },
    }),
  };
}
