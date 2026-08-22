import { connectPhotonCredentials } from "@vercel/connect/eve";
import { photonIMessageChannel } from "eve/channels/photon";

// PHOTON_CONNECTOR is the Vercel Connect connector UID. The fallback is the
// connector created in the Connect dashboard for this project.
export default photonIMessageChannel({
  credentials: connectPhotonCredentials(
    process.env.PHOTON_CONNECTOR ?? "photon/eve",
  ),
});
