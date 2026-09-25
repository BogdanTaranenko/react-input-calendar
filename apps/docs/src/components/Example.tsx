import type { ReactNode } from 'react';
import { example } from '../examples/registry';
import { CodeBlock } from './CodeBlock';

interface ExampleProps {
  /** Path under `src/examples/`, without `.tsx`, e.g. `date-picker/Basic`. */
  path: string;
  title: string;
  children?: ReactNode;
}

const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** A live example above the exact source that renders it. */
export function Example({ path, title, children }: ExampleProps) {
  const { Component, source } = example(path);
  const id = slug(title);
  return (
    <section className="example" aria-labelledby={id}>
      <h3 id={id}>{title}</h3>
      {children && <div className="example-text">{children}</div>}
      <div className="example-preview">
        <Component />
      </div>
      <CodeBlock code={source} />
    </section>
  );
}
