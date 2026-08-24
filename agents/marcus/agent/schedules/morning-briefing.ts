import { defineSchedule } from "eve/schedules";

import slack from "../channels/slack.js";

// 12:00 UTC weekdays = 8am ET. No-op until MARCUS_BRIEFING_CHANNEL is set to
// a Slack channel ID in the Vercel project environment.
export default defineSchedule({
  cron: "0 12 * * 1-5",
  async run({ to, waitUntil, appAuth }) {
    const channelId = process.env.MARCUS_BRIEFING_CHANNEL;
    if (!channelId) return;
    waitUntil(
      to(slack, { channelId }).send(
        "Run the morning_briefing skill and post today's briefing to this channel.",
        { auth: appAuth },
      ),
    );
  },
});
