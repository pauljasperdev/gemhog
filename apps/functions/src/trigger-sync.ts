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

  try {
    const [dailyResult, weeklyResult] = await Promise.allSettled([
      lambda.send(
        new InvokeCommand({
          FunctionName: dailyFunctionName,
          InvocationType: "RequestResponse",
        }),
      ),
      lambda.send(
        new InvokeCommand({
          FunctionName: weeklyFunctionName,
          InvocationType: "RequestResponse",
        }),
      ),
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Sync triggered",
        daily: {
          function: dailyFunctionName,
          statusCode:
            dailyResult.status === "fulfilled"
              ? dailyResult.value.StatusCode
              : undefined,
          status: dailyResult.status,
          ...(dailyResult.status === "rejected" && {
            error:
              dailyResult.reason instanceof Error
                ? dailyResult.reason.message
                : String(dailyResult.reason),
          }),
        },
        weekly: {
          function: weeklyFunctionName,
          statusCode:
            weeklyResult.status === "fulfilled"
              ? weeklyResult.value.StatusCode
              : undefined,
          status: weeklyResult.status,
          ...(weeklyResult.status === "rejected" && {
            error:
              weeklyResult.reason instanceof Error
                ? weeklyResult.reason.message
                : String(weeklyResult.reason),
          }),
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to invoke sync functions",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
