import { devToolsMiddleware } from "@ai-sdk/devtools";
import { google } from "@ai-sdk/google";
import { createContext } from "@gemhog/api/context";
import { appRouter } from "@gemhog/api/routers/index";
import { auth } from "@gemhog/core/auth";
import { env } from "@gemhog/env/server";
import { trpcServer } from "@hono/trpc-server";
import type { UIMessage } from "ai";
import { convertToModelMessages, streamText, wrapLanguageModel } from "ai";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from "zod";

// Schema for AI message validation
// Validates the UI message parts structure used by AI SDK v6
const TextPartSchema = z.object({
  type: z.literal("text"),
  text: z.string().max(10000, "Text content too long"), // 10KB max per text part
});

const FilePartSchema = z.object({
  type: z.literal("file"),
  url: z.string().url(),
  mediaType: z.string().optional(),
});

// Allow other part types to pass through (reasoning, tool, etc.)
const OtherPartSchema = z
  .object({
    type: z.string(),
  })
  .passthrough();

const MessagePartSchema = z.union([
  TextPartSchema,
  FilePartSchema,
  OtherPartSchema,
]);

const UIMessageSchema = z.object({
  id: z.string().optional(), // ID may be omitted in some cases
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(MessagePartSchema).max(100, "Too many message parts"),
  metadata: z.unknown().optional(),
});

const AIRequestSchema = z.object({
  messages: z
    .array(UIMessageSchema)
    .max(50, "Too many messages") // Limit conversation history
    .min(1, "At least one message required"),
});

// Simple in-memory rate limiter
// For production with multiple servers, use Redis-based rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute window

const rateLimit = (identifier: string): boolean => {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_WINDOW);

const app = new Hono();

app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => {
      return createContext({ context });
    },
  }),
);

app.post("/ai", async (c) => {
  // Rate limiting
  // Use IP as identifier (or session ID if authenticated)
  const clientId =
    c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "anonymous";
  if (!rateLimit(clientId)) {
    return c.json({ error: "Too many requests. Please try again later." }, 429);
  }

  const body = await c.req.json();

  // Validate input
  const parseResult = AIRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { error: "Invalid request", details: parseResult.error.flatten() },
      400,
    );
  }

  // Cast validated messages to UIMessage type for AI SDK
  const uiMessages = parseResult.data.messages as Omit<UIMessage, "id">[];
  const model = wrapLanguageModel({
    model: google("gemini-2.5-flash"),
    middleware: devToolsMiddleware(),
  });
  const result = streamText({
    model,
    messages: await convertToModelMessages(uiMessages),
  });

  return result.toUIMessageStreamResponse();
});

app.get("/", (c) => {
  return c.text("OK");
});

import { serve } from "@hono/node-server";

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
