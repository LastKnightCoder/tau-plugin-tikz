import { build } from "esbuild";
import AdmZip from "adm-zip";
import { mkdir, readFile, writeFile, mkdtemp, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { collectSkills } from "./skills.mjs";
import { buildPortablePluginManifest } from "@tau/plugins/portable";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

const shared = [
  "@tau/plugins",
  "@tau/plugins/whiteboard",
  "@tau/plugins/sync",
  "@tau/ui",
  "react",
  "react-dom",
  "react-dom/client",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
];
await mkdir("dist", { recursive: true });
const staging = await mkdtemp(path.resolve("dist/.building-"));
const buildId = randomUUID();
const pointer = path.resolve("dist", `.building-pointer-${buildId}`);
try {
  const readme = await readFile("README.md", "utf8");
  if (!readme.trim()) throw new Error("README.md 必须包含插件介绍与使用说明");
  if (typeof manifest.description !== "string" || !manifest.description.trim())
    throw new Error("manifest.description 必须为非空简介");
  await writeFile(path.join(staging, "README.md"), readme);
  for (const name of ["CHANGELOG.md"]) {
    try {
      await writeFile(path.join(staging, name), await readFile(name));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  // 插件中心只接收 LICENSE 一个许可文件，第三方许可全文按顺序附在其后
  const licenses = [];
  for (const name of ["LICENSE", "THIRD_PARTY_NOTICES.md", "LICENSE-LPPL.md", "LICENSE-BAKOMA.txt"])
    licenses.push(
      `${name === "LICENSE" ? "" : `\n\n----- ${name} -----\n\n`}${await readFile(name, "utf8")}`
    );
  await writeFile(path.join(staging, "LICENSE"), licenses.join(""));
  const result = await build({
    entryPoints: ["src/index.tsx"],
    outfile: path.join(staging, "main.js"),
    bundle: true,
    platform: "browser",
    format: "cjs",
    target: "es2022",
    jsx: "automatic",
    external: shared,
    metafile: true,
    loader: { ".svg": "dataurl", ".md": "text" },
    plugins: [
      {
        name: "tikz-vendor-text",
        setup(builder) {
          builder.onLoad({ filter: /\/vendor\/(tikzjax\.js|tikz\.vendor\.css)$/ }, async args => ({
            contents: await readFile(args.path, "utf8"),
            loader: "text",
          }));
        },
      },
    ],
    define: {
      __PLUGIN_META__: JSON.stringify({
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
      }),
    },
  });
  for (const output of Object.values(result.metafile.outputs)) {
    for (const dependency of output.imports) {
      if (dependency.external && !shared.includes(dependency.path))
        throw new Error(`插件构建包含未支持的外部依赖：${dependency.path}`);
    }
  }
  const styles = Object.keys(result.metafile.outputs).some(file => file.endsWith("main.css"));
  if (manifest.sync !== undefined)
    throw new Error("同步提供方应在渲染入口注册，不再支持Node后台入口");
  const skills = await collectSkills(staging);
  const integrity = {};
  for (const file of skills.files)
    integrity[file] = createHash("sha256")
      .update(await readFile(path.join(staging, file)))
      .digest("hex");
  for (const file of ["main.js", ...(styles ? ["main.css"] : [])])
    integrity[file] = createHash("sha256")
      .update(await readFile(path.join(staging, file)))
      .digest("hex");
  await writeFile(
    path.join(staging, "manifest.json"),
    JSON.stringify(
      buildPortablePluginManifest(manifest, {
        main: "main.js",
        ...(skills.ids.length ? { skills: skills.ids } : {}),
        integrity,
        ...(styles ? { styles: "main.css" } : {}),
      }),
      null,
      2
    )
  );
  const destination = path.resolve("dist", `${manifest.version}-${buildId}`);
  await rename(staging, destination);
  await writeFile(
    pointer,
    JSON.stringify({
      formatVersion: 1,
      id: manifest.id,
      buildId,
      directory: path.basename(destination),
    })
  );
  await rename(pointer, path.resolve("dist", `tau-build-${manifest.id}.json`));
  const zip = new AdmZip();
  zip.addLocalFolder(destination, manifest.id);
  const archive = path.resolve("dist", `${manifest.id}-${manifest.version}.zip`);
  zip.writeZip(archive);
  const archiveSize = (await stat(archive)).size;
  const expandedSize = zip.getEntries().reduce((total, entry) => total + entry.header.size, 0);
  if (archiveSize > 8 * 1024 * 1024 || expandedSize > 32 * 1024 * 1024)
    throw new Error("插件包超过中心限制：ZIP 8 MiB，展开总量 32 MiB");
  console.log(`ZIP ${archiveSize} 字节，展开 ${expandedSize} 字节`);
  console.log(
    `构建完成：${archive}\n运行 pnpm install:local，或将 ZIP 解压至 ~/.editor/plugins，然后在插件管理中刷新列表并启用。`
  );
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
} finally {
  await rm(pointer, { force: true });
}
