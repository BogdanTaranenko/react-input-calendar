import type { DateRange } from '../core/types';
import { toISODate, toISODateTime } from '../date/iso';

/** What to submit: the picker's mode, its value and the field names. */
export type HiddenInputsValue =
  | {
      mode: 'single';
      name?: string | undefined;
      value: Date | null;
      withTime?: boolean | undefined;
    }
  | { mode: 'multiple'; name?: string | undefined; value: readonly Date[] }
  | {
      mode: 'range';
      startName?: string | undefined;
      endName?: string | undefined;
      value: DateRange | null;
    };

export type HiddenInputsProps = HiddenInputsValue & {
  /** Disabled fields are not submitted, as with native inputs. */
  disabled?: boolean | undefined;
};

/**
 * Mirrors the value into `<input type="hidden">`s so a native `<form>` submits it, in local ISO
 * formats: `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm` with a time. An empty single date or range end
 * submits an empty string; an empty multiple selection submits nothing. No name, no input.
 */
export function HiddenInputs(props: HiddenInputsProps) {
  const entries: [name: string, value: string][] = [];
  if (props.mode === 'single') {
    const format = props.withTime ? toISODateTime : toISODate;
    if (props.name) entries.push([props.name, props.value ? format(props.value) : '']);
  } else if (props.mode === 'range') {
    const { from, to } = props.value ?? { from: null, to: null };
    if (props.startName) entries.push([props.startName, from ? toISODate(from) : '']);
    if (props.endName) entries.push([props.endName, to ? toISODate(to) : '']);
  } else if (props.name) {
    for (const date of props.value) entries.push([props.name, toISODate(date)]);
  }

  return entries.map(([name, value], index) => (
    <input key={index} type="hidden" name={name} value={value} disabled={props.disabled} />
  ));
}
