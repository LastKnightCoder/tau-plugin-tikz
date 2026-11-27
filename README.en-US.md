# TikZ Diagrams

Write TikZ code in your documents and preview rendered SVG diagrams right away—no LaTeX installation or internet connection required. Rendered diagrams can also be published to your blog.

## Getting Started

1. Install **TikZ Diagrams** from the Plugin Center, enable it on the **Installed** tab, and click **Restart now** on the banner at the top of the Plugins page.
2. Open the block menu in a document and choose **TikZ**.
3. Write your TikZ code and click **Done**; wait a moment for the diagram to render.

```tikz
\begin{tikzpicture}
\draw[->] (0,0) -- (2,0);
\draw (0,0) circle (0.5);
\end{tikzpicture}
```

You do not need `\documentclass`; pasting a full snippet with a `document` environment works too. You can also ask the AI assistant to write TikZ code for you.

## FAQ

**Why is the first render slow?** The TeX engine loads on first use, after which rendering is much faster. Each diagram has a timeout of up to 2 minutes.

**What happens if there is a syntax error?** An error message points out the issue while keeping the last successfully rendered diagram visible.

**Can I use arbitrary LaTeX packages?** No. Only TikZ and the commonly used packages bundled with the plugin are supported; external packages and external file includes are not available.

**Will I lose my diagrams if I disable or uninstall the plugin?** No. The source code stays saved in your documents and renders again once you re-enable the plugin.

**Why don't diagrams show up on mobile?** Mobile apps and the browser extension cannot render TikZ diagrams yet, though your content stays safe and displays normally on desktop.

## Tips

- Restart Tau after enabling, disabling, or updating this plugin—the Plugins page will prompt you with **Restart now**.
- Make sure this plugin is installed and enabled when publishing a blog containing TikZ diagrams.
