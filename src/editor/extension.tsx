import { PenTool } from "lucide-react";
import {
  defineEditorElement,
  defineEditorExtension,
  insertSourceBlock,
  sourceBlockParagraphBehavior,
} from "@tau/plugins";
import { TikzBlock } from "./TikzBlock";
import { sourceHtml } from "./markdown";
import type { TikzElement } from "./types";

export const tikzExtension = defineEditorExtension({
  id: "tau.tikz",
  elements: [
    defineEditorElement<TikzElement>({
      type: "tikz",
      kind: "block",
      drag: true,
      isVoid: true,
      isEmpty: element => !element.content,
      render: props => <TikzBlock {...props} />,
    }),
  ],
  blockPanel: [
    {
      icon: PenTool,
      title: "TikZ",
      keywords: ["tikz", "TikZ", "huitu"],
      description: "TikZ 绘图",
      onClick: editor => {
        insertSourceBlock(editor, {
          type: "tikz",
          content: "",
          children: [{ type: "formatted", text: "" }],
        });
      },
    },
  ],
  behaviorsFor: { paragraph: sourceBlockParagraphBehavior("tikz") },
  htmlSerializers: [{ type: "tikz", toHtml: sourceHtml }],
});
