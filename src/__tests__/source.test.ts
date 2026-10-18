import { describe, expect, it } from "vitest";
import { prepareSource } from "../compiler/source";
import { sourceHtml, tikzCodec } from "../editor/markdown";

describe("源码协议", () => {
  it("为片段包装环境，保留缩进、注释和空行", () => {
    const source = "\\begin{tikzpicture}\n  % 注释\n\n  \\draw (0,0) -- (1,1);\n\\end{tikzpicture}";
    expect(prepareSource(source)).toBe(`\\begin{document}\n${source}\n\\end{document}`);
  });
  it("已有 document 环境不重复包装", () => {
    const source = "\\begin{document}\n\\begin{tikzpicture}\\end{tikzpicture}\n\\end{document}";
    expect(prepareSource(source)).toBe(source);
  });
  it("宏包前言保持在 document 之前", () => {
    const preamble = "\\usepackage{pgfplots}\n\\pgfplotsset{compat=1.16}\n";
    const picture = "\\begin{tikzpicture}\n\\end{tikzpicture}";
    expect(prepareSource(preamble + picture)).toBe(
      `${preamble}\\begin{document}\n${picture}\n\\end{document}`
    );
  });
  it("空源码和独立文档类明确报错", () => {
    expect(() => prepareSource(" \n")).toThrow("不能为空");
    expect(() => prepareSource("\\documentclass{standalone}")).toThrow("documentclass");
  });
  it("Markdown 和静态 HTML 保留源码且转义 HTML", () => {
    const element = { type: "tikz", content: "<script>&\"'</script>", children: [] };
    expect(tikzCodec.fence).toEqual({ language: "tikz" });
    expect(tikzCodec.serializer!.toMarkdown!(element, "")).toBe(
      "```tikz\n" + element.content + "\n```"
    );
    expect(sourceHtml(element)).toContain("&lt;script&gt;&amp;&quot;&#039;&lt;/script&gt;");
  });
});
