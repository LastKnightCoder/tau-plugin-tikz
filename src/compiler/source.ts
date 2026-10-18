export function prepareSource(source: string): string {
  if (!source.trim()) throw new Error("TikZ 源码不能为空");
  if (/\\documentclass\b/.test(source)) throw new Error("请移除 documentclass，TikZ 已提供文档类");
  if (/\\begin\s*\{document\}/.test(source)) return source;
  const start = source.search(/\\begin\s*\{(?:tikzpicture|tikzcd|circuitikz)\}/);
  const boundary = start < 0 ? 0 : start;
  return `${source.slice(0, boundary)}\\begin{document}\n${source.slice(boundary)}\n\\end{document}`;
}
