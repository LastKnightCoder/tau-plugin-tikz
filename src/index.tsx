import { definePlugin } from "@tau/plugins";
import { tikzExtension } from "./editor/extension";
import { tikzCodec } from "./editor/markdown";

declare const __PLUGIN_META__: { id: string; name: string; version: string };

export default definePlugin({
  ...__PLUGIN_META__,
  editorExtensions: [tikzExtension],
  editorCodecs: [tikzCodec],
});
