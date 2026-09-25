import type { CSSProperties } from 'react';
import { DatePicker } from '@b.taranenko/react-input-calendar';

const SELECTED = new Date(2026, 8, 24);

export function DarkPropFixture() {
  return (
    <div className="dark-panel">
      <DatePicker label="Dark by prop" colorScheme="dark" defaultValue={SELECTED} />
    </div>
  );
}

export function DarkAncestorFixture() {
  return (
    <div className="dark-panel" data-ric-theme="dark">
      <DatePicker label="Dark by ancestor" defaultValue={SELECTED} />
    </div>
  );
}

export function AccentAncestorFixture() {
  return (
    <div style={{ '--ric-accent': 'rgb(204 0 0)' } as CSSProperties}>
      <DatePicker label="Red accent" defaultValue={SELECTED} />
    </div>
  );
}
