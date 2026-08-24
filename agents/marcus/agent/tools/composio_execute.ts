import { defineTool } from "eve/tools";
import { z } from "zod";
import { getComposioSession } from "../lib/composio.js";

export default defineTool({
  description:
    "Execute a Composio tool by slug (discover slugs with composio_search). Runs against the connected account for that app. If the app is not connected yet, the result contains a connect link — send it to the user and retry after they approve.",
  inputSchema: z.object({
    tool_slug: z
      .string()
      .min(1)
      .describe('Tool slug from composio_search, e.g. "ATTIO_LIST_RECORDS"'),
    arguments: z
      .record(z.string(), z.unknown())
      .optional()
      .describe(
        "Tool arguments matching the input schema returned by composio_search",
      ),
  }),
  async execute({ tool_slug, arguments: args }) {
    const session = await getComposioSession();
    return session.execute(tool_slug, args);
  },
});
