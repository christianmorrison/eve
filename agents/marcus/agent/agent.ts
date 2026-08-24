import { defineAgent } from "eve";

export default defineAgent({
  // Any AI Gateway "provider/model" slug. MARCUS_MODEL overrides without a
  // code change; deepseek flash is cheap for chat but weak at multi-step
  // tool use — switch to anthropic/claude-sonnet-4.6 for demo workflows.
  model: process.env.MARCUS_MODEL ?? "deepseek/deepseek-v4-flash-0731",
});
