/** What each `--ric-*` token affects, in `tokens.css` order. Enforced by `references.test.ts`. */
export const tokenDocs: Record<string, string> = {
  '--ric-color-scheme':
    'The `color-scheme` of fields and popups, so native scrollbars match. Follows the scheme; rarely set by hand.',
  '--ric-accent':
    'Selected days, months, years and times, the Done button, the focused trigger border and the today ring. The hover, range, preview and focus colours are mixed from it wherever it is set.',
  '--ric-accent-contrast': 'Text on the accent: selected day numbers and the Done button label.',
  '--ric-bg': 'Background of the trigger and its clear button.',
  '--ric-surface':
    'Background of the popover, the bottom sheet and the inline calendar. Also the gap inside the focus ring.',
  '--ric-surface-raised': 'Background of a read-only trigger.',
  '--ric-text': 'Main text colour of fields and popups.',
  '--ric-text-muted':
    'Weekday names, outside and unavailable days, helper text, icons and the navigation arrows.',
  '--ric-border':
    'Trigger border, dividers between presets, calendar, time panel and footer, and the sheet handle.',
  '--ric-hover':
    'Hover background of days, months, years, presets, time options and header buttons. Optional: defaults to the accent mixed with transparent, 10% in light and 22% in dark.',
  '--ric-range-bg':
    'The band behind a selected range, and the active preset. Optional: defaults to the accent mixed with transparent, 16% in light and 30% in dark.',
  '--ric-preview-border':
    'Dashed outline of the range preview while hovering for the end day. Optional: defaults to 60% accent over transparent in light, 80% over white in dark.',
  '--ric-today-ring':
    "Ring around today's day and the current month and year. Optional: defaults to the accent.",
  '--ric-focus-ring':
    'Box shadow of every focused control. Optional: defaults to a 2px gap in the surface colour and a 2px accent ring.',
  '--ric-danger': 'Error text and the border of an invalid trigger.',
  '--ric-backdrop': 'The dimmed backdrop behind the bottom sheet.',
  '--ric-radius':
    'Corners of the popover, the sheet, the inline calendar, the trigger and the time options.',
  '--ric-radius-cell':
    'Corners of day, month and year cells and the range band ends. `999px` is a circle.',
  '--ric-cell-size':
    'Width and height of a day cell, and so the width of the calendar and the field.',
  '--ric-time-option-size': 'Height of a time option; the time columns show five.',
  '--ric-gap': 'Space between cells and between presets.',
  '--ric-padding':
    'Inner padding of the popup, the calendar and the trigger, and the space between months.',
  '--ric-field-height':
    'Minimum height of the trigger, and the width of its icon and clear button.',
  '--ric-field-width':
    'Width of the field and its helper text. Not declared: it defaults to the calendar width. Set it to stretch the field.',
  '--ric-font': 'Font family. `inherit` uses the page font.',
  '--ric-font-size': 'Base font size; weekday names and helper text scale from it.',
  '--ric-shadow': 'Shadow of the popover and the sheet.',
  '--ric-duration':
    'Length of every animation and transition. The sheet takes 1.5×. Motion stops under `prefers-reduced-motion`.',
  '--ric-ease': 'Easing of every animation and transition.',
};
