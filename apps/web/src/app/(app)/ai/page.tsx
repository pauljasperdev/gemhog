"use client";

import { useChat } from "@ai-sdk/react";
import { clientEnv } from "@gemhog/env/client-runtime";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function AIPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `${clientEnv.NEXT_PUBLIC_SERVER_URL}/ai`,
    }),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll on message count change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto grid w-full grid-rows-[1fr_auto] overflow-hidden p-4">
      <div className="space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <div className="mt-8 text-center text-muted-foreground">
            Ask me anything to get started!
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "rounded-lg border p-4 text-sm leading-relaxed",
                message.role === "user"
                  ? "ml-12 border-accent/20 bg-accent/10 text-foreground"
                  : "mr-12 border-border bg-secondary/50 text-secondary-foreground",
              )}
            >
              <p className="mb-2 font-semibold text-xs uppercase tracking-wider opacity-70">
                {message.role === "user" ? "You" : "AI Assistant"}
              </p>
              {message.parts?.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <Streamdown
                      key={`${message.id}-${index}`}
                      isAnimating={
                        status === "streaming" && message.role === "assistant"
                      }
                    >
                      {part.text}
                    </Streamdown>
                  );
                }
                return null;
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center space-x-2 border-muted border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Input
          name="prompt"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border-muted bg-secondary/50 focus-visible:ring-accent/50"
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" variant="accent" size="icon">
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
}
