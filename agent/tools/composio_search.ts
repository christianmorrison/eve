import { defineTool } from "eve/tools";
import { z } from "zod";
import { getComposioSession } from "../lib/composio.js";

export default defineTool({
  description:
    "Search Composio's catalog of 1000+ app integrations (Gmail, Google Calendar, Notion, GitHub, PandaDoc, CRMs, and more) for tools matching a use case. Returns tool slugs, descriptions, and input schemas. Run a found tool with composio_execute.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe(
        'What you want to do, in plain language, e.g. "send an email" or "create a Notion page"',
      ),
    toolkits: z
      .array(z.string())
      .optional()
      .describe('Optional toolkit slugs to narrow the search, e.g. ["gmail"]'),
  }),
  async execute({ query, toolkits }) {
    const session = await getComposioSession();
    return session.search({ query, toolkits });
  },
});
