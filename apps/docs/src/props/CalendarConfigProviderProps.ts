import { localeProps, slotProps } from './shared';
import type { PropDoc } from './types';

export const props: PropDoc[] = [
  {
    name: 'children',
    type: 'ReactNode',
    description: 'Every picker and calendar below uses these defaults.',
  },
  ...localeProps,
  ...slotProps,
  {
    name: 'mobileBreakpoint',
    type: 'number | false',
    default: '640',
    description: 'Below this viewport width pickers open as a bottom sheet; `false` never does.',
  },
  {
    name: 'colorScheme',
    type: "'system' | 'light' | 'dark'",
    default: "'system'",
    description: 'Scheme for every component below.',
  },
];
