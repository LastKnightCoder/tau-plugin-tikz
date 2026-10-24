import type { EditorMetricRule } from "@tau/plugins";

export const editorMetrics = [
  {
    type: "tikz",
    textFields: ["content"],
  },
] as const satisfies readonly EditorMetricRule[];
