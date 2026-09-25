import type { ComponentType } from 'react';

// Each example file is both rendered and shown as source, so the code on the page is the code
// that runs.
const components = import.meta.glob<ComponentType>('./*/*.tsx', { import: 'default', eager: true });
const sources = import.meta.glob<string>('./*/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
});

export interface LoadedExample {
  Component: ComponentType;
  source: string;
}

export function example(path: string): LoadedExample {
  const Component = components[`./${path}.tsx`];
  const source = sources[`./${path}.tsx`];
  if (!Component || source === undefined) throw new Error(`No example at src/examples/${path}.tsx`);
  return { Component, source };
}
