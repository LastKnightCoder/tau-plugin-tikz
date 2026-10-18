import compilerSource from "../vendor/tikzjax.js";
import fontCss from "../vendor/tikz.vendor.css";
import { prepareSource } from "./source";

export const COMPILE_TIMEOUT = 120_000;

export async function compileTikz(source: string, signal?: AbortSignal): Promise<string> {
  signal?.throwIfAborted();
  const code = prepareSource(source);
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.dataset.tauTikz = "compiler";
    frame.setAttribute("aria-hidden", "true");
    const url = URL.createObjectURL(new Blob([compilerSource], { type: "text/javascript" }));
    let observer: MutationObserver | undefined;
    let settled = false;
    const finish = (error?: unknown, svg?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      observer?.disconnect();
      frame.onload = null;
      frame.remove();
      URL.revokeObjectURL(url);
      if (error) reject(error);
      else if (svg === undefined) reject(new Error("TikZ 未返回 SVG"));
      else resolve(svg);
    };
    const cancel = () => finish(signal?.reason ?? new DOMException("编译已取消", "AbortError"));
    const timer = setTimeout(() => finish(new Error("TikZ 编译超过 120 秒")), COMPILE_TIMEOUT);
    signal?.addEventListener("abort", cancel, { once: true });
    frame.onload = () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) throw new Error("无法创建 TikZ 编译上下文");
        doc.body.addEventListener("tikzjax-load-finished", () => {
          const svg = doc.body.querySelector("svg");
          if (!svg) return;
          const style = doc.createElementNS("http://www.w3.org/2000/svg", "style");
          style.textContent = fontCss;
          svg.prepend(style);
          finish(undefined, new XMLSerializer().serializeToString(svg));
        });
        observer = new MutationObserver(() => {
          if (doc.querySelector("[data-tau-tikz-error]"))
            finish(new Error("TikZ 编译失败，请检查语法与宏包"));
        });
        observer.observe(doc.body, { childList: true, subtree: true });
        const input = doc.createElement("script");
        input.type = "text/tikz";
        input.dataset.disableCache = "true";
        input.textContent = code;
        doc.body.appendChild(input);
        const compiler = doc.createElement("script");
        compiler.src = url;
        compiler.onerror = () => finish(new Error("TikZ 编译器加载失败"));
        doc.body.appendChild(compiler);
      } catch (error) {
        finish(error);
      }
    };
    frame.srcdoc = "<!doctype html><html><head><meta charset='utf-8'></head><body></body></html>";
    try {
      document.body.appendChild(frame);
    } catch (error) {
      finish(error);
    }
    if (signal?.aborted) cancel();
  });
}
