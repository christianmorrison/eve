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

// SLACK_CONNECTOR is provisioned by the "Deploy with Vercel" button. To set it
// up yourself, create a connector with `vercel connect create slack --triggers`
// and put its UID in SLACK_CONNECTOR (or replace the fallback below).
export default slackChannel({
  credentials: connectSlackCredentials(
    process.env.SLACK_CONNECTOR ?? "slack/my-agent",
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
