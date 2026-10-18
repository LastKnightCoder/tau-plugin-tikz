import { definePlugin } from "@tau/plugins";
import { tikzExtension } from "./editor/extension";
import { tikzCodec } from "./editor/markdown";
import content from "./skills/tikz.md";

declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  editorExtensions: [tikzExtension],
  editorCodecs: [tikzCodec],
  skills: [
    {
      id: "authoring",
      name: "TikZ 绘图",
      description: "在用户要求用 TikZ 绘图或修改文档中的 TikZ 源码时使用。",
      content,
    },
  ],
});
