import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

// The "Marcus" Slack app's Vercel Connect connector. Its trigger destination
// must point at this agent's mounted path: /eve/agents/marcus/eve/v1/slack.
export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.MARCUS_SLACK_CONNECTOR ?? "slack/marcus",
  ),
});
