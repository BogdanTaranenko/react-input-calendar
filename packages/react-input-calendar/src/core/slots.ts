import type { CSSProperties } from 'react';
import { useCalendarConfig } from './config-context';

/** Every addressable part of every component. Slot `x` renders the class `ric-<kebab-x>`. */
export const SLOT_NAMES = [
  'root',
  'label',
  'description',
  'error',
  'field',
  'trigger',
  'triggerValue',
  'triggerIcon',
  'clearButton',
  'popover',
  'sheet',
  'backdrop',
  'sheetHandle',
  'calendar',
  'header',
  'caption',
  'navButton',
  'months',
  'month',
  'grid',
  'weekdays',
  'weekday',
  'week',
  'day',
  'dayButton',
  'monthGrid',
  'monthButton',
  'yearGrid',
  'yearButton',
  'presets',
  'preset',
  'timePanel',
  'timeColumn',
  'timeOption',
  'footer',
  'doneButton',
  'liveRegion',
] as const;

export type SlotName = (typeof SLOT_NAMES)[number];
export type SlotClassNames = Partial<Record<SlotName, string>>;
export type SlotStyles = Partial<Record<SlotName, CSSProperties>>;

export interface SlotProps {
  classNames?: SlotClassNames | undefined;
  styles?: SlotStyles | undefined;
}

export interface SlotAttributes {
  className: string;
  style: CSSProperties | undefined;
}

export function slotClassName(name: SlotName): string {
  return `ric-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

/**
 * Returns `slot(name, extraClass?)` → `{ className, style }` for spreading onto an element.
 * Classes concatenate default → provider → prop → extra; styles shallow-merge, prop winning.
 */
export function useSlots(props: SlotProps): (name: SlotName, extraClass?: string) => SlotAttributes {
  const config = useCalendarConfig();
  return (name, extraClass) => {
    const className = [
      slotClassName(name),
      config.classNames?.[name],
      props.classNames?.[name],
      extraClass,
    ]
      .filter(Boolean)
      .join(' ');
    const providerStyle = config.styles?.[name];
    const propStyle = props.styles?.[name];
    const style = providerStyle || propStyle ? { ...providerStyle, ...propStyle } : undefined;
    return { className, style };
  };
}
