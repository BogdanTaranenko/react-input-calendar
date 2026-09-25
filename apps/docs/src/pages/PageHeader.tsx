import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  children?: ReactNode;
}

/** The page's `h1` takes focus on navigation, so it is focusable but not in the tab order. */
export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <header className="page-header">
      <h1 tabIndex={-1}>{title}</h1>
      {children && <p className="lead">{children}</p>}
    </header>
  );
}
