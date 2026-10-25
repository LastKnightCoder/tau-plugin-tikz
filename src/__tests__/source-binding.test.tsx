import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { TikzBlock } from "../editor/TikzBlock";

const host = vi.hoisted(() => ({ update: vi.fn(), props: {} as Record<string, unknown>, theme: { isDark: false, token: () => "black" } }));
vi.mock("@tau/plugins", () => ({
  useSourceBlock: () => ({ theme: host.theme, compiler: undefined, update: host.update }),
  SourceBlockEditor: (props: Record<string, unknown> & { children: ReactNode }) => { host.props = props; return props.children; },
}));
vi.mock("../render/TikzPreview", () => ({ TikzPreview: (props: { content: string }) => props.content }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it("远端源码更新复用当前节点字段绑定，不整段回写或产生预览写入", async () => {
  const container = document.createElement("div"), root = createRoot(container);
  const element = { type: "tikz" as const, content: "原文", children: [{ type: "formatted" as const, text: "" }] };
  try {
    await act(async () => root.render(<TikzBlock attributes={{ "data-slate-node": "element", ref: null }} element={element}>{null}</TikzBlock>));
    expect(host.props.element).toBe(element);
    expect(host.props.field).toBe("content");
    expect(host.props).not.toHaveProperty("initValue");
    expect(host.props).not.toHaveProperty("onChange");
    const remote = { ...element, content: "远端输入😀" };
    await act(async () => root.render(<TikzBlock attributes={{ "data-slate-node": "element", ref: null }} element={remote}>{null}</TikzBlock>));
    expect(host.props.element).toBe(remote);
    expect(container.textContent).toContain("远端输入😀");
    expect(host.update).not.toHaveBeenCalled();
  } finally { await act(async () => root.unmount()); }
});
