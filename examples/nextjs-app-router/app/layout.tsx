import type { ReactNode } from 'react';
import '@b.taranenko/react-input-calendar/styles.css';

export const metadata = { title: 'react-input-calendar on the Next.js App Router' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
