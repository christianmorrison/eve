import { defineTool } from "eve/tools";
import { z } from "zod";
import { getComposioSession } from "../lib/composio.js";

export default defineTool({
  description:
    "Execute a Composio tool by slug (discover slugs with composio_search). Runs against the connected account for that app. If the app is not connected yet, the result contains a connect link — send it to the user and retry after they approve. Always pass the full arguments object matching the schema from composio_search; for the rare tool that takes no input, pass arguments as {\"__no_args\": true}.",
  inputSchema: z.object({
    tool_slug: z
      .string()
      .min(1)
      .describe('Tool slug from composio_search, e.g. "ATTIO_LIST_RECORDS"'),
    arguments: z
      .union([z.record(z.string(), z.unknown()), z.string()])
      .optional()
      .describe(
        'Tool arguments matching the input schema returned by composio_search, as a JSON object (not a string). For a tool with no inputs, pass {"__no_args": true}.',
      ),
  }),
  async execute({ tool_slug, arguments: rawArgs }) {
    // Some models double-encode the arguments object as a JSON string.
    let args = rawArgs;
    if (typeof args === "string") {
      try {
        args = JSON.parse(args) as Record<string, unknown>;
      } catch {
        return {
          error: "invalid_arguments",
          message: `arguments for ${tool_slug} was a string that is not valid JSON. Retry with arguments as a JSON object matching the schema from composio_search.`,
        };
      }
    }
    // Some models drop the nested arguments object entirely, which would
    // execute the tool with provider defaults (e.g. a Zoom meeting with no
    // attendees). Refuse instead of silently doing the wrong thing.
    const entries = args ? Object.keys(args) : [];
    if (entries.length === 0) {
      return {
        error: "empty_arguments",
        message: `No arguments were provided for ${tool_slug}. Re-run composio_search to get its input schema, then retry with the complete arguments object. If this tool genuinely takes no input, retry with arguments: {"__no_args": true}.`,
      };
    }
    const { __no_args, ...rest } = args as Record<string, unknown>;
    const session = await getComposioSession();
    return session.execute(tool_slug, __no_args ? rest : args);
  },
});
