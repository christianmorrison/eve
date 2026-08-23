import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {};

// Two independent eve agents in one project, mounted at
// /eve/agents/<name>/eve/v1/*. Connect trigger destinations must use the
// per-agent paths (e.g. /eve/agents/eve/eve/v1/slack).
export default withEve(nextConfig, {
  agents: {
    eve: ".",
    marcus: {
      root: "./agents/marcus",
      // Workaround for an eve<=0.44.3 bug: for nested agent roots the
      // relative EVE_INTERNAL_BUILD_OUTPUT_DIRECTORY is resolved against the
      // workspace root instead of the agent root, producing /.eve/... and an
      // EXDEV rename failure. Re-export it as an absolute path before build.
      buildCommand:
        'export EVE_INTERNAL_BUILD_OUTPUT_DIRECTORY="$(cd ../.. && pwd)/.eve/vercel-services/eve-marcus/.vercel/output" && node ../../node_modules/eve/bin/eve.js build',
    },
  },
});
