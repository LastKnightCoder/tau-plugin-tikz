import { PenTool } from "lucide-react";
import { SourceBlockEditor, useSourceBlock, type EditorElementRenderProps } from "@tau/plugins";
import { TikzPreview } from "../render/TikzPreview";
import type { TikzElement } from "./types";

export function TikzBlock({
  attributes,
  children,
  element,
}: EditorElementRenderProps<TikzElement>) {
  const { update, theme } = useSourceBlock(element);
  return (
    <div {...attributes}>
      <SourceBlockEditor
        mode="stex"
        title="TikZ"
        icon={PenTool}
        initValue={element.content}
        onChange={content => update({ content })}
        element={element}
        center
      >
        <TikzPreview content={element.content} isDark={theme.isDark} />
      </SourceBlockEditor>
      {children}
    </div>
  );
}
