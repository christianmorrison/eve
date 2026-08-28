import { connectPhotonCredentials } from "@vercel/connect/eve";
import { photonIMessageChannel } from "eve/channels/photon";

// Comma-separated sender handles (phone numbers / Apple ID emails) allowed to
// use the agent. Unset = allow everyone.
const allowedSenders = (process.env.PHOTON_ALLOWED_SENDERS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// message.author is untyped upstream, so probe the likely handle fields.
function senderHandle(author: unknown): string | null {
  if (!author || typeof author !== "object") return null;
  const a = author as Record<string, unknown>;
  for (const key of ["id", "handle", "phone", "email"]) {
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
    // Author field names are untyped upstream; keep this until confirmed in logs.
    console.log("[photon] inbound author:", JSON.stringify(author));

    if (allowedSenders.length > 0) {
      if (!handle || !allowedSenders.includes(handle.toLowerCase())) {
        console.log("[photon] dropped message from unallowed sender:", handle);
        return null;
      }
    }

    const fullName =
      typeof author?.fullName === "string" ? author.fullName : null;
    return {
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
