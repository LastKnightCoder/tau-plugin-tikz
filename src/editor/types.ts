export interface TikzElement {
  type: "tikz";
  content: string;
  children: { type: "formatted"; text: string }[];
}

declare module "@tau/plugins" {
  interface EditorElementMap {
    tikz: TikzElement;
  }
}
