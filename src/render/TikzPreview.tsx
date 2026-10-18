import { useEffect, useRef, useState } from "react";
import { useReportPreviewError } from "@tau/plugins";
import { compileTikz } from "../compiler/compile";

export function TikzPreview({ content, isDark }: { content: string; isDark: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasResult, setHasResult] = useState(false);
  const reported = useReportPreviewError(error, { stale: hasResult });
  useEffect(() => {
    const target = container.current;
    if (!target) return;
    const controller = new AbortController();
    setError(null);
    if (!content.trim()) {
      target.replaceChildren();
      setHasResult(false);
      return;
    }
    void compileTikz(content, controller.signal).then(
      svg => {
        if (controller.signal.aborted) return;
        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
        target.replaceChildren(document.importNode(parsed.documentElement, true));
        setHasResult(true);
        setError(null);
      },
      reason => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : String(reason));
      }
    );
    return () => controller.abort();
  }, [content]);
  return (
    <div data-tau-tikz-preview contentEditable={false}>
      <div
        ref={container}
        style={{ filter: isDark ? "invert(1) hue-rotate(180deg)" : undefined }}
      />
      {!content.trim() && <p>暂无 TikZ 内容</p>}
      {content.trim() && !hasResult && !error && <p role="status">正在编译 TikZ…</p>}
      {error && !reported && <p role="alert">{error}</p>}
    </div>
  );
}
