import { defineTool } from "eve/tools";
import { z } from "zod";
import { parseRehabWorkbook } from "../lib/sow-parser.js";
import { assessSow } from "../lib/rehab-benchmarks.js";

export default defineTool({
  description:
    "Parse a FlipCo 'Budget & Specifications' rehab scope-of-work workbook (.xlsx) and assess every line item against installed-cost benchmarks (labor + materials, regionally adjusted). Returns project facts, the work narrative, per-line expected ranges with preliminary verdicts (agree / flag_high / disagree_high / flag_low / scope_check / no_benchmark), and structural findings (contingency, bundled trades, total mismatches). Pass the sandbox path of an uploaded workbook, e.g. /workspace/attachments/<file>.xlsx.",
  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe(
        "Sandbox path to the .xlsx file, usually under /workspace/attachments/",
      ),
  }),
  async execute({ path }, ctx) {
    const sandbox = await ctx.getSandbox();
    const bytes = await sandbox.readBinaryFile({ path });
    if (!bytes) {
      const ls = await sandbox.run({ command: "ls -la /workspace/attachments 2>/dev/null || echo 'no attachments directory'" });
      throw new Error(
        `No file at ${path}. Attachments directory contents:\n${ls.stdout || ls.stderr}`,
      );
    }
    const parsed = parseRehabWorkbook(bytes);
    const assessment = assessSow(parsed);
    return { parsed, assessment };
  },
});
