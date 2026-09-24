import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import type { SlotAttributes, SlotName } from '../core/slots';

export interface TimeColumnOption {
  value: number;
  label: string;
  disabled: boolean;
  /** Lower-case strings that typing can match, e.g. `['5', '05', '٠٥']` or `['pm']`. */
  keys: readonly string[];
}

export interface TimeColumnProps {
  /** The listbox's accessible name: `labels.hours`, `labels.minutes` or `labels.dayPeriod`. */
  label: string;
  options: readonly TimeColumnOption[];
  selected: number | null;
  /** Where focus starts when `selected` is not an option, e.g. the nearest minute on the step. */
  defaultFocus?: number | null | undefined;
  onSelect: (value: number) => void;
  slot: (name: SlotName) => SlotAttributes;
}

/** Typed characters within this many milliseconds build one search string. */
const TYPEAHEAD_MS = 1000;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Scrolls only the column (never the page) so `option` sits in its middle. */
function centre(column: HTMLElement, option: HTMLElement, behavior: ScrollBehavior) {
  const columnRect = column.getBoundingClientRect();
  const optionRect = option.getBoundingClientRect();
  const offset = optionRect.top - columnRect.top - (columnRect.height - optionRect.height) / 2;
  column.scrollTo({ top: column.scrollTop + offset, behavior });
}

function findMatch(options: readonly TimeColumnOption[], search: string) {
  return (
    options.find((option) => option.keys.includes(search))
    ?? options.find((option) => option.keys.some((key) => key.startsWith(search)))
  );
}

/**
 * One scroll column of the time panel: an APG listbox. The column is the tab stop and points
 * at the focused option with `aria-activedescendant`. Moving selects, except onto an
 * unavailable option, which can be focused but never selected.
 */
export function TimeColumn(props: TimeColumnProps) {
  const { options, selected, slot } = props;
  const baseId = useId();
  const optionId = (value: number) => `${baseId}-${String(value)}`;

  // Focus follows the selection unless the user moved it; a new selection resets it.
  const [explicitFocus, setExplicitFocus] = useState<number | null>(null);
  const [lastSelected, setLastSelected] = useState(selected);
  if (selected !== lastSelected) {
    setLastSelected(selected);
    setExplicitFocus(null);
  }
  // Only values that are options: anything else would leave aria-activedescendant dangling.
  const isOption = (value: number | null | undefined): value is number =>
    value !== null && value !== undefined && options.some((option) => option.value === value);
  const focused = [explicitFocus, selected, props.defaultFocus].find(isOption)
    ?? (options.find((option) => !option.disabled) ?? options[0])?.value;

  const columnRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);
  useLayoutEffect(() => {
    const column = columnRef.current;
    const option = column?.querySelector<HTMLElement>('[data-focused]');
    if (!column || !option) return;
    centre(column, option, hasScrolled.current && !prefersReducedMotion() ? 'smooth' : 'instant');
    hasScrolled.current = true;
  }, [focused]);

  const typed = useRef({ search: '', at: 0 });

  const move = (option: TimeColumnOption | undefined, confirm = false) => {
    if (!option) return;
    setExplicitFocus(option.value);
    if (!option.disabled && (confirm || option.value !== selected)) props.onSelect(option.value);
  };

  const typeahead = (key: string) => {
    const now = Date.now();
    const previous = now - typed.current.at > TYPEAHEAD_MS ? '' : typed.current.search;
    const search = previous + key.toLowerCase();
    const match = findMatch(options, search);
    typed.current = { search: match ? search : key.toLowerCase(), at: now };
    return match ?? findMatch(options, key.toLowerCase());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((option) => option.value === focused);
    const last = options.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: Math.min(last, index + 1),
      ArrowUp: Math.max(0, index - 1),
      Home: 0,
      End: last,
    };
    const target = targets[event.key];
    if (target !== undefined) {
      event.preventDefault();
      move(options[target]);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      move(options[index], true);
    } else if (
      event.key.length === 1
      && !event.ctrlKey
      && !event.metaKey
      && !event.altKey
      && !event.nativeEvent.isComposing
    ) {
      const match = typeahead(event.key);
      if (match) {
        event.preventDefault();
        move(match);
      }
    }
  };

  // One delegated handler: the options are not focusable themselves (the column is).
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const id = event.target instanceof Element ? event.target.closest('[role="option"]')?.id : undefined;
    move(options.find((option) => optionId(option.value) === id), true);
  };

  return (
    <div
      {...slot('timeColumn')}
      ref={columnRef}
      role="listbox"
      aria-label={props.label}
      aria-activedescendant={focused === undefined ? undefined : optionId(focused)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={handleClick}
    >
      {options.map((option) => (
        <div
          key={option.value}
          {...slot('timeOption')}
          id={optionId(option.value)}
          role="option"
          aria-selected={option.value === selected}
          aria-disabled={option.disabled || undefined}
          data-selected={option.value === selected || undefined}
          data-disabled={option.disabled || undefined}
          data-focused={option.value === focused || undefined}
        >
          {option.label}
        </div>
      ))}
    </div>
  );
}
