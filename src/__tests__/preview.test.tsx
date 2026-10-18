import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { TikzPreview } from "../render/TikzPreview";
import { compileTikz } from "../compiler/compile";

vi.mock("@tau/plugins", () => ({ useReportPreviewError: () => false }));
vi.mock("../compiler/compile", () => ({ compileTikz: vi.fn() }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const host = document.createElement("div");
const root = createRoot(host);
afterEach(() => vi.clearAllMocks());

it("快速修改拒绝迟到结果，失败保留成功图，清空和卸载取消任务", async () => {
  const requests: {
    signal: AbortSignal;
    resolve(value: string): void;
    reject(error: Error): void;
  }[] = [];
  vi.mocked(compileTikz).mockImplementation(
    (_source, signal) =>
      new Promise((resolve, reject) => {
        requests.push({ signal: signal!, resolve, reject });
      })
  );
  const render = async (content: string) =>
    act(async () => {
      root.render(<TikzPreview content={content} isDark={false} />);
    });
  await render("a");
  await render("b");
  expect(requests[0].signal.aborted).toBe(true);
  await act(async () =>
    requests[1].resolve('<svg xmlns="http://www.w3.org/2000/svg"><text>b</text></svg>')
  );
  await act(async () =>
    requests[0].resolve('<svg xmlns="http://www.w3.org/2000/svg"><text>a</text></svg>')
  );
  expect(host.querySelector("svg")!.textContent).toBe("b");
  await render("bad");
  await act(async () => requests[2].reject(new Error("编译失败")));
  expect(host.querySelector("svg")!.textContent).toBe("b");
  expect(host.querySelector('[role="alert"]')!.textContent).toBe("编译失败");
  await render("");
  expect(host.querySelector("svg")).toBeNull();
  expect(requests[2].signal.aborted).toBe(true);
  await render("pending");
  await act(async () => root.unmount());
  expect(requests[3].signal.aborted).toBe(true);
});
