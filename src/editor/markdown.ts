import type { EditorMarkdownCodec } from "@tau/plugins";

export const tikzCodec: EditorMarkdownCodec = {
  type: "tikz",
  isVoid: true,
  fence: { language: "tikz" },
  serializer: {
    isBlock: true,
    toMarkdown: element => "```tikz\n" + String(element.content ?? "") + "\n```",
  },
};

export function sourceHtml(element: Record<string, unknown>) {
  const text = String(element.content ?? "").replace(
    /[&<>"']/g,
    character =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]!
  );
  return `<pre class="tikz-fallback"><code>${text}</code></pre>`;
}
