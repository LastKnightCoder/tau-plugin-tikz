import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "tikz-vendor-as-text",
      enforce: "pre",
      resolveId(id) {
        if (/\/vendor\/(tikzjax\.js|tikz\.vendor\.css)$/.test(id)) return "\0tikz-test-resource";
      },
      load(id) {
        if (id === "\0tikz-test-resource") return "export default '测试资源'";
      },
    },
  ],
  test: { environment: "jsdom" },
});
