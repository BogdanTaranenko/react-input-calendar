import type { ReactNode } from 'react';

/** 16px line icons in `currentColor`, hidden from assistive technology. */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <Icon>
      <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
    </Icon>
  );
}

export function XIcon() {
  return (
    <Icon>
      <path d="m4.5 4.5 7 7m0-7-7 7" />
    </Icon>
  );
}
