import { Example } from '../components/Example';
import { props } from '../props/CalendarProps';
import { props as dayProps } from '../props/DayRenderProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar">
        The calendar on its own, inline on the page, in single, range or multiple mode.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="calendar/Modes" title="Modes">
        <code>mode</code> sets the value type: <code>Date | null</code>,{' '}
        <code>DateRange | null</code> or <code>Date[]</code>.
      </Example>
      <Example path="calendar/Constraints" title="Constraints">
        <code>disabledDates</code> also takes a predicate.
      </Example>
      <Example path="calendar/Locale" title="Locale and RTL" />
      <Example path="calendar/Customization" title="Customisation">
        A price under each day with <code>renderDay</code>. The button, its state and its keyboard
        handling stay the library's.
      </Example>
      <Example path="calendar/ControlledMonth" title="Controlled month">
        <code>month</code> and <code>onMonthChange</code> control the visible month. When you render
        on the server, pass <code>defaultMonth</code> so the first paint shows a month.
      </Example>
      <ApiReference
        tables={[
          { typeName: 'CalendarProps', props },
          { typeName: 'DayRenderProps', props: dayProps },
        ]}
      />
    </>
  );
}
