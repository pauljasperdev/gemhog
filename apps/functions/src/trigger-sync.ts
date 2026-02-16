import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const lambda = new LambdaClient({});

export async function handler() {
  const functionName = process.env.SYNC_FUNCTION_NAME;
  if (!functionName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "SYNC_FUNCTION_NAME not set" }),
    };
  }

  try {
    const result = await lambda.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "RequestResponse",
      }),
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Sync triggered successfully",
        function: functionName,
        statusCode: result.StatusCode,
        executedVersion: result.ExecutedVersion,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to invoke sync function",
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
}
