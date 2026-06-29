declare module "react-syntax-highlighter" {
  import { ComponentType } from "react";

  interface SyntaxHighlighterProps {
    children: string | string[];
    language?: string;
    style?: Record<string, React.CSSProperties>;
    customStyle?: React.CSSProperties;
    codeTagProps?: Record<string, unknown>;
    PreTag?: string | ComponentType;
    CodeTag?: string | ComponentType;
    showLineNumbers?: boolean;
    wrapLines?: boolean;
    lineNumberStyle?: React.CSSProperties;
  }

  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module "react-syntax-highlighter/dist/esm/styles/prism" {
  export const vscDarkPlus: Record<string, React.CSSProperties>;
  export const oneDark: Record<string, React.CSSProperties>;
}
