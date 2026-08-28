import { connectPhotonCredentials } from "@vercel/connect/eve";
import { photonIMessageChannel } from "eve/channels/photon";

// Comma-separated sender handles (phone numbers / Apple ID emails) allowed to
// use the agent. Unset = allow everyone.
const allowedSenders = (process.env.PHOTON_ALLOWED_SENDERS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// message.author is untyped upstream. Confirmed shape (2026-08-28 logs):
// { userId: "+1…", userName: "+1…", fullName: "+1…", isBot, isMe }
function senderHandle(author: unknown): string | null {
  if (!author || typeof author !== "object") return null;
  const a = author as Record<string, unknown>;
  for (const key of ["userId", "id", "handle", "phone", "email"]) {
    const v = a[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

// PHOTON_CONNECTOR is the Vercel Connect connector UID. The fallback is the
// connector created in the Connect dashboard for this project.
export default photonIMessageChannel({
  credentials: connectPhotonCredentials(
    process.env.PHOTON_CONNECTOR ?? "photon/eve",
  ),
  onMessage(_ctx, message) {
    const author = message.author;
    if (author?.isBot) return null;

    const handle = senderHandle(author);

    if (allowedSenders.length > 0) {
      if (!handle || !allowedSenders.includes(handle.toLowerCase())) {
        console.log("[photon] dropped message from unallowed sender:", handle);
        return null;
      }
    }

    const fullName =
      typeof author?.fullName === "string" ? author.fullName : null;
    return {
      // Titles the run in Agent Runs when this message starts a new
      // conversation, so traces are searchable by sender.
      title: `iMessage ${handle ?? fullName ?? "unknown sender"}`,
      auth: handle
        ? {
            authenticator: "photon",
            principalId: handle,
            principalType: "user",
            attributes: { channel: "imessage" },
          }
        : null,
      context: [
        `iMessage sender: ${fullName ?? "unknown"}${handle ? ` (${handle})` : ""}`,
      ],
    };
  },
});
