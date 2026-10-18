import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { compileTikz, COMPILE_TIMEOUT } from "../compiler/compile";

const source = "\\begin{tikzpicture}\\draw (0,0)--(1,1);\\end{tikzpicture}";
const revoke = vi.fn();
function context() {
  const frame = document.querySelector<HTMLIFrameElement>("iframe[data-tau-tikz]")!;
  frame.dispatchEvent(new Event("load"));
  return { frame, doc: frame.contentDocument! };
}

describe("编译任务生命周期", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:tikz-test"),
      revokeObjectURL: revoke,
    });
    revoke.mockClear();
  });
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("成功 SVG 包含字体并清理 iframe 和 Blob URL", async () => {
    const pending = compileTikz(source);
    const { frame, doc } = context();
    expect(doc.querySelector('script[type="text/tikz"]')!.textContent).toContain(source);
    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.appendChild(doc.createElementNS(svg.namespaceURI, "path"));
    doc.body.appendChild(svg);
    svg.dispatchEvent(new Event("tikzjax-load-finished", { bubbles: true }));
    expect(await pending).toContain("<style>测试资源</style>");
    expect(frame.isConnected).toBe(false);
    expect(revoke).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("失败占位拒绝任务并清理资源", async () => {
    const pending = compileTikz(source);
    const result = expect(pending).rejects.toThrow("请检查语法");
    const { doc } = context();
    const failure = doc.createElement("span");
    failure.dataset.tauTikzError = "";
    doc.body.appendChild(failure);
    await result;
    expect(document.querySelector("iframe")).toBeNull();
    expect(revoke).toHaveBeenCalledOnce();
  });
  it("取消和超时均拒绝结果并回收上下文", async () => {
    const controller = new AbortController();
    const cancelled = compileTikz(source, controller.signal);
    const rejection = expect(cancelled).rejects.toMatchObject({ name: "AbortError" });
    controller.abort();
    await rejection;
    const pending = compileTikz(source);
    const timeout = expect(pending).rejects.toThrow("120 秒");
    await vi.advanceTimersByTimeAsync(COMPILE_TIMEOUT);
    await timeout;
    expect(document.querySelector("iframe")).toBeNull();
    expect(revoke).toHaveBeenCalledTimes(2);
  });
  it("预取消不创建资源，源码不会被解析成 HTML", async () => {
    await expect(compileTikz(source, AbortSignal.abort())).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    const controller = new AbortController();
    const pending = compileTikz(
      source + '</script><img src="https://example.com">',
      controller.signal
    );
    const result = expect(pending).rejects.toMatchObject({ name: "AbortError" });
    const { doc } = context();
    expect(doc.querySelector("img")).toBeNull();
    controller.abort();
    await result;
  });
});
