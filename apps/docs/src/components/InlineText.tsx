import { Fragment } from 'react';

/** Renders `code` spans in plain prose: the props tables keep their text free of JSX. */
export function InlineText({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? <code key={index}>{part}</code> : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  );
}
