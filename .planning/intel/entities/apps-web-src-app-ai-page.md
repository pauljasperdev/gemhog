---
path: /home/lima/repo/apps/web/src/app/ai/page.tsx
type: component
updated: 2025-01-21
status: active
---

# page.tsx

## Purpose

AI chat interface page using the Vercel AI SDK. Provides a real-time chat experience with streaming responses from the Google Gemini model. Displays message history with distinct styling for user and AI messages, auto-scrolls to new content, and renders markdown via Streamdown.

## Exports

- `default AIPage(): JSX.Element` - AI chat page with message input and streaming display

## Dependencies

- [[apps-web-src-components-ui-button]] - Send button for message submission
- [[packages-env-src-web]] - Environment config for server URL
- @ai-sdk/react - useChat hook for AI conversation management
- ai - DefaultChatTransport for API communication
- lucide-react - Send icon
- streamdown - Markdown rendering with animation support

## Used By

TBD

## Notes

Uses custom transport pointing to /ai endpoint on the backend server.
