import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

// Two independent eve agents in one project, mounted at
// /eve/agents/<name>/eve/v1/*. Connect trigger destinations must use the
// per-agent paths (e.g. /eve/agents/eve/eve/v1/slack).
export default withEve(nextConfig, {
  agents: {
    eve: ".",
    marcus: "./agents/marcus",
  },
});
