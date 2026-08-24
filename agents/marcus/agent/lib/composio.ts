import { Composio } from "@composio/core";
import { defineState } from "eve/context";

// One Composio Tool Router session per eve session, so connected-account
// state and auth follow-ups survive across turns.
const composioSession = defineState<{ sessionId: string | null }>(
  "app.composio.session",
  () => ({ sessionId: null }),
);

let client: Composio | undefined;

function getClient(): Composio {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COMPOSIO_API_KEY is not set. Add it to the Vercel project environment and redeploy.",
    );
  }
  client ??= new Composio({ apiKey });
  return client;
}

export async function getComposioSession() {
  const composio = getClient();
  const { sessionId } = composioSession.get();
  if (sessionId) {
    try {
      return await composio.use(sessionId);
    } catch {
      // Stale or deleted session; create a fresh one below.
    }
  }
  const userId = process.env.COMPOSIO_USER_ID ?? "empros";
  const session = await composio.create(userId);
  composioSession.update(() => ({ sessionId: session.sessionId }));
  return session;
}
