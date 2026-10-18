# TikZ 插件维护

基于 LastKnightCoder/tau-plugin-template 创建。保留模板的构建、安装与 tag 发布流程，使用 pnpm 管理依赖。

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

入口静态声明 editorExtensions、editorCodecs 和 skills，不调用宿主编译服务。编译器与字体通过 build.mjs 的精确 text loader 内嵌，模块加载和 codec 求值不会创建 DOM、Worker 或执行引擎。首次渲染时创建任务 iframe，调用结束、取消或超时后清理。

修改 vendor 前先保存来源和摘要，更新 THIRD_PARTY_NOTICES.md。构建会携带许可证并检查中心的 ZIP 8 MiB、展开 32 MiB 上限；不要把运行时资源改为 CDN 请求，也不要将编辑器、Slate 或宿主私有路径打进插件。

单测覆盖源码协议、生命周期和快速更新。真实 WASM 与完整包行为由宿主包级验收验证，单测使用文本资源替身，不等同于实际编译通过。视觉验收由用户完成。
