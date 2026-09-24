import type { SlotAttributes, SlotName } from '../core/slots';

export interface CalendarHeaderProps {
  /** First of the month (or, in the month and year views, the focused month) this header is for. */
  month: Date;
  caption: string;
  /** Put on the caption text, which names the grid via `aria-labelledby`. */
  captionId: string;
  /** The caption button's name; it must start with the visible caption (WCAG 2.5.3). */
  captionLabel: string | undefined;
  onCaption: (month: Date) => void;
  previousLabel: string;
  nextLabel: string;
  /** Which nav buttons this header holds: the first month has previous, the last next. */
  showPrevious: boolean;
  showNext: boolean;
  previousDisabled: boolean;
  nextDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  slot: (name: SlotName) => SlotAttributes;
}

/** Points left in LTR; calendar.css mirrors it under `dir="rtl"`. */
function Chevron({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path
        d={direction === 'previous' ? 'M10 3 5 8l5 5' : 'm6 3 5 5-5 5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A month's header. With one month: caption, previous, next. With several, previous comes
 * first in the first month and next last in the last, matching where calendar.css draws them.
 * The caption button switches between the day, month and year views.
 */
export function CalendarHeader(props: CalendarHeaderProps) {
  const { slot } = props;
  const alone = props.showPrevious && props.showNext;

  const previous = props.showPrevious && (
    <button
      type="button"
      {...slot('navButton')}
      data-nav="previous"
      aria-label={props.previousLabel}
      disabled={props.previousDisabled}
      onClick={props.onPrevious}
    >
      <Chevron direction="previous" />
    </button>
  );
  const next = props.showNext && (
    <button
      type="button"
      {...slot('navButton')}
      data-nav="next"
      aria-label={props.nextLabel}
      disabled={props.nextDisabled}
      onClick={props.onNext}
    >
      <Chevron direction="next" />
    </button>
  );
  const caption = (
    <button
      type="button"
      {...slot('caption')}
      aria-label={props.captionLabel}
      onClick={() => {
        props.onCaption(props.month);
      }}
    >
      <span id={props.captionId}>{props.caption}</span>
    </button>
  );

  return (
    <div {...slot('header')}>
      {!alone && previous}
      {caption}
      {alone && previous}
      {next}
    </div>
  );
}
