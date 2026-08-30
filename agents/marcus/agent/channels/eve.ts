import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc } from "eve/channels/auth";

// Same-project Vercel OIDC callers (CLI, curl with the project token) and
// local dev. No public/unauthenticated access.
export default eveChannel({
  auth: [vercelOidc(), localDev()],
});
