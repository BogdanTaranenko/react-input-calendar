import { useEffect, useState } from 'react';
import type { HighlighterCore } from 'shiki/core';

export type CodeLanguage = 'tsx' | 'bash' | 'css';

let highlighter: Promise<HighlighterCore> | undefined;

/** One shared highlighter with only the grammars and themes the site uses. */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([import('shiki/core'), import('shiki/engine/javascript')]).then(
    ([{ createHighlighterCore }, { createJavaScriptRegexEngine }]) =>
      createHighlighterCore({
        themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
        langs: [
          import('shiki/langs/tsx.mjs'),
          import('shiki/langs/bash.mjs'),
          import('shiki/langs/css.mjs'),
        ],
        engine: createJavaScriptRegexEngine(),
      }),
  );
  return highlighter;
}

interface CodeBlockProps {
  code: string;
  lang?: CodeLanguage;
  copyLabel?: string;
}

export function CodeBlock({ code, lang = 'tsx', copyLabel = 'Copy' }: CodeBlockProps) {
  const source = code.trimEnd();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    getHighlighter()
      .then((instance) => {
        if (!live) return;
        setHtml(
          instance.codeToHtml(source, {
            lang,
            themes: { light: 'github-light', dark: 'github-dark' },
            defaultColor: false,
          }),
        );
      })
      .catch((error: unknown) => {
        // The plain block below stays readable; only the colours are missing.
        console.warn('Syntax highlighting failed', error);
      });
    return () => {
      live = false;
    };
  }, [source, lang]);

  const copy = () => {
    navigator.clipboard.writeText(source).then(
      () => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 1500);
      },
      (error: unknown) => {
        console.warn('Copy failed', error);
      },
    );
  };

  return (
    <div className="code-block">
      <button type="button" className="copy-button" onClick={copy}>
        {copied ? 'Copied' : copyLabel}
      </button>
      {html === null ? (
        <pre>
          <code>{source}</code>
        </pre>
      ) : (
        // Shiki escapes the source; the input is this site's own example files.
        <div dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
}
