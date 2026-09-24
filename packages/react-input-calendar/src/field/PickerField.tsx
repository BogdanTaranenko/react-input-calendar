import { useId, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import type { ColorScheme } from '../core/config-context';
import { useSlots, type SlotProps } from '../core/slots';
import type { CalendarLabels } from '../i18n/labels';
import type { TextDirection } from '../i18n/locale-info';
import { HiddenInputs, type HiddenInputsValue } from './HiddenInputs';
import { CalendarIcon, XIcon } from './icons';
import { RequiredValidator } from './RequiredValidator';

export interface PickerFieldProps extends SlotProps {
  label?: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  placeholder?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  /** The trigger button's id. */
  id?: string | undefined;
  'aria-label'?: string | undefined;
  'aria-labelledby'?: string | undefined;
  /** Default `true`. */
  clearable?: boolean | undefined;
  /** Replaces the calendar icon; `false` removes it. */
  icon?: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;

  // Wiring, from `usePicker`'s `fieldProps`.
  /** The formatted value; empty shows the placeholder. */
  text: string;
  hasValue: boolean;
  open: boolean;
  onOpen: () => void;
  onClear: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  dir: TextDirection;
  colorScheme: ColorScheme;
  labels: CalendarLabels;
  formValue: HiddenInputsValue;
  /** The surface: its `<dialog>` renders inside the root, inheriting theme and direction. */
  children?: ReactNode;
}

const isShown = (node: ReactNode) =>
  node !== undefined && node !== null && node !== false && node !== '';

const joinIds = (...ids: (string | false)[]) => ids.filter(Boolean).join(' ') || undefined;

/** The always-visible part of a picker: label, trigger, clear button, helper and error text. */
export function PickerField(props: PickerFieldProps) {
  const { label, description, error, hasValue, triggerRef, labels } = props;
  const { disabled = false, readOnly = false, clearable = true, icon } = props;
  const slot = useSlots(props);
  const baseId = useId();
  const triggerId = props.id ?? `${baseId}-trigger`;
  const labelId = `${baseId}-label`;
  const valueId = `${baseId}-value`;
  const descriptionId = `${baseId}-description`;
  const errorId = `${baseId}-error`;

  // Like a native input, a disabled or read-only field is not validated.
  const validates = Boolean(props.required) && !disabled && !readOnly;
  // Set by a blocked form submission; a value, or no longer validating, clears it (adjusting
  // state during render).
  const [requiredFailed, setRequiredFailed] = useState(false);
  if (requiredFailed && (hasValue || !validates)) setRequiredFailed(false);
  const invalid = isShown(error) || requiredFailed;

  // The name is always "<name> <value>". The trigger names itself (it can reference its own
  // aria-label) when there is no label element to point at.
  const ariaLabelledBy = props['aria-labelledby'];
  const ownLabel = ariaLabelledBy
    ? undefined
    : (props['aria-label'] ?? (isShown(label) ? undefined : labels.openCalendar));
  const namedBy = ariaLabelledBy ?? (ownLabel === undefined ? labelId : triggerId);

  const root = slot('root', props.className);
  return (
    <div
      className={root.className}
      style={{ ...root.style, ...props.style }}
      dir={props.dir}
      data-ric-theme={props.colorScheme === 'system' ? undefined : props.colorScheme}
      data-disabled={disabled || undefined}
      data-invalid={invalid || undefined}
      data-open={props.open || undefined}
      data-readonly={readOnly || undefined}
    >
      {isShown(label) && (
        <span id={labelId} {...slot('label')}>
          {label}
        </span>
      )}
      <div {...slot('field')}>
        {/* aria-invalid is global in ARIA 1.2 (1.3 narrows it to form roles); the error text
            also reaches assistive technology through aria-describedby. */}
        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          {...slot('trigger')}
          aria-haspopup="dialog"
          aria-expanded={props.open}
          aria-label={ownLabel}
          aria-labelledby={`${namedBy} ${valueId}`}
          aria-describedby={joinIds(
            isShown(description) && descriptionId,
            isShown(error) && errorId,
          )}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          data-placeholder={!hasValue || undefined}
          onClick={readOnly ? undefined : props.onOpen}
        >
          <span id={valueId} {...slot('triggerValue')} suppressHydrationWarning>
            {hasValue ? props.text : props.placeholder}
          </span>
          {icon !== false && (
            <span {...slot('triggerIcon')} aria-hidden="true">
              {icon ?? <CalendarIcon />}
            </span>
          )}
        </button>
        {clearable && hasValue && !disabled && !readOnly && (
          <button
            type="button"
            {...slot('clearButton')}
            aria-label={labels.clear}
            onClick={() => {
              props.onClear();
              // The button unmounts with the value; keep focus in the field.
              triggerRef.current?.focus();
            }}
          >
            <XIcon />
          </button>
        )}
      </div>
      {isShown(description) && (
        <div id={descriptionId} {...slot('description')}>
          {description}
        </div>
      )}
      {isShown(error) && (
        <div id={errorId} {...slot('error')}>
          {error}
        </div>
      )}
      <HiddenInputs {...props.formValue} disabled={disabled} />
      {validates && (
        <RequiredValidator
          hasValue={hasValue}
          triggerRef={triggerRef}
          onInvalid={() => {
            setRequiredFailed(true);
          }}
        />
      )}
      {props.children}
    </div>
  );
}
