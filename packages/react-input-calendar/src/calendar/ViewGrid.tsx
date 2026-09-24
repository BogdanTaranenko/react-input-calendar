import type { KeyboardEvent } from 'react';
import type { SlotAttributes, SlotName } from '../core/slots';

/** One month or year button. `date` is the first day of that month or year. */
export interface ViewCell {
  date: Date;
  text: string;
  label: string;
  selected: boolean;
  current: boolean;
  focused: boolean;
  disabled: boolean;
}

export interface ViewGridProps {
  cells: readonly ViewCell[];
  captionId: string;
  gridSlot: 'monthGrid' | 'yearGrid';
  buttonSlot: 'monthButton' | 'yearButton';
  slot: (name: SlotName) => SlotAttributes;
  onSelect: (date: Date) => void;
  onFocus: (date: Date) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const COLUMNS = 3;

/**
 * The 3 × 4 `grid` behind the month and year views. State is exposed as presence-only data
 * attributes on the button, which is what calendar.css styles; the `gridcell` carries
 * `aria-selected`. Unavailable cells stay focusable and ignore activation, like days.
 */
export function ViewGrid(props: ViewGridProps) {
  const { cells, slot } = props;
  const rows = Array.from({ length: Math.ceil(cells.length / COLUMNS) }, (_, row) =>
    cells.slice(row * COLUMNS, (row + 1) * COLUMNS),
  );

  return (
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus -- roving tab stop: focus lives on the cells (APG grid)
    <div
      {...slot(props.gridSlot)}
      role="grid"
      aria-labelledby={props.captionId}
      onKeyDown={props.onKeyDown}
    >
      {rows.map((row, index) => (
        <div key={index} role="row">
          {row.map((cell) => (
            <div key={cell.date.getTime()} role="gridcell" aria-selected={cell.selected}>
              <button
                type="button"
                {...slot(props.buttonSlot)}
                tabIndex={cell.focused ? 0 : -1}
                aria-label={cell.label}
                aria-disabled={cell.disabled || undefined}
                aria-current={cell.current ? 'date' : undefined}
                data-selected={cell.selected || undefined}
                data-current={cell.current || undefined}
                data-focused={cell.focused || undefined}
                data-disabled={cell.disabled || undefined}
                onClick={() => {
                  if (!cell.disabled) props.onSelect(cell.date);
                }}
                onFocus={() => {
                  props.onFocus(cell.date);
                }}
              >
                {cell.text}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
