# react-input-calendar

[![npm](https://img.shields.io/npm/v/@b.taranenko/react-input-calendar)](https://www.npmjs.com/package/@b.taranenko/react-input-calendar)
[![CI](https://github.com/BogdanTaranenko/react-input-calendar/actions/workflows/ci.yml/badge.svg)](https://github.com/BogdanTaranenko/react-input-calendar/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@b.taranenko/react-input-calendar)](./LICENSE)

Accessible, themeable React date pickers with zero runtime dependencies: a single date, a date range, multiple dates, a date and time, and an inline calendar.

![DateRangePicker open in light and dark themes](https://raw.githubusercontent.com/BogdanTaranenko/react-input-calendar/main/docs-assets/hero.png)

**[Documentation and live examples →](https://bogdantaranenko.github.io/react-input-calendar/)**

## Install

```bash
npm i @b.taranenko/react-input-calendar
```

React 18 or 19 is the only peer dependency.

## Quick start

```tsx
import { useState } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';
import '@b.taranenko/react-input-calendar/styles.css';

export function BookingDate() {
  const [date, setDate] = useState<Date | null>(null);
  return <DatePicker label="Check-in" name="checkIn" value={date} onChange={setDate} />;
}
```

`DateRangePicker`, `MultiDatePicker`, `DateTimePicker` and the inline `Calendar` work the same way. `CalendarConfigProvider` sets the locale and labels for a whole app.

## Features

- **Zero dependencies.** Native `Date` and `Intl`, and its own positioning code. React is the only peer, and `sideEffects` covers only the CSS, so unused pickers are tree-shaken.
- **Looks finished out of the box.** One stylesheet gives a labelled field, a popover with a soft shadow, a filled selection circle, a pill band for ranges with a hover preview, and an animated month change. Dark mode follows the system, or set it with `colorScheme` or a `data-ric-theme` attribute on any ancestor.
- **Accessible.** Follows the WAI-ARIA date picker dialog pattern: a native modal `<dialog>`, a full keyboard grid (mirrored in RTL), localized day labels and announced month changes. axe reports no violations for any component, open or closed, in light and dark, on desktop and mobile.
- **Mobile-ready.** Below 640 px (configurable) the picker opens as a bottom sheet. Swipe to change month, swipe down to close, and the page behind stops scrolling.
- **Customisable at every level.** Every colour, radius and size is a `--ric-*` variable. Every part takes a class or style through `classNames` and `styles`. State is exposed as `data-*` attributes, and `renderDay` and `formatValue` replace content. All CSS sits in `@layer ric`, so your own styles win without specificity tricks.

It also submits through native forms (`name`, `required`, React 19 `<form action>`), renders on the server and hydrates cleanly (tested in the Next.js App Router), and takes names, week start, direction and clock from the `locale`.

## Size

Min+gzip, measured with `size-limit`:

| Import              | Size    |
| ------------------- | ------- |
| Everything          | 14.4 kB |
| `DatePicker` only   | 13.8 kB |
| `styles.css` (gzip) | 3.7 kB  |

## Browser support

Chrome and Edge 111+, Safari 16.4+, Firefox 113+.

## Guides

- [Theming](https://bogdantaranenko.github.io/react-input-calendar/#/theming), with a live theme customiser
- [Accessibility](https://bogdantaranenko.github.io/react-input-calendar/#/accessibility)
- [Internationalisation](https://bogdantaranenko.github.io/react-input-calendar/#/i18n)
- [Recipes](https://bogdantaranenko.github.io/react-input-calendar/#/recipes): Tailwind, CSS Modules, react-hook-form, Next.js

## License

[MIT](./LICENSE) © 2026 Bogdan Taranenko
