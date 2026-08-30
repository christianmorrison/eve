import { connectSlackCredentials } from "@vercel/connect/eve";
import {
  defaultSlackAuth,
  slackChannel,
  type SlackMessage,
} from "eve/channels/slack";

// Comma-separated Slack user IDs allowed to invoke the agent. Defaults to
// Christian only; extend via env without a code change.
const allowedUsers = new Set(
  (process.env.SLACK_ALLOWED_USERS ?? "U0BFL8VUM5X")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

function isAllowedUser(message: SlackMessage) {
  const userId = message.author?.userId;
  return Boolean(userId && allowedUsers.has(userId));
}

// The "Marcus" Slack app's Vercel Connect connector. Its trigger destination
// must point at this agent's mounted path: /eve/agents/marcus/eve/v1/slack.
export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.MARCUS_SLACK_CONNECTOR ?? "slack/marcus",
  ),
  onAppMention(ctx, message) {
    if (!isAllowedUser(message)) return null;
    return { auth: defaultSlackAuth(message, ctx) };
  },
  onDirectMessage(ctx, message) {
    if (!isAllowedUser(message)) return null;
    return { auth: defaultSlackAuth(message, ctx) };
  },
  onInputResponse(ctx, submission) {
    if (!allowedUsers.has(submission.user.id)) return null;
    return { auth: ctx.defaultAuth };
  },
});
