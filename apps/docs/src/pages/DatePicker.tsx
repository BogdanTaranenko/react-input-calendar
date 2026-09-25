import { Example } from '../components/Example';
import { props } from '../props/DatePickerProps';
import { props as dayProps } from '../props/DayRenderProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function DatePickerPage() {
  return (
    <>
      <PageHeader title="DatePicker">
        One day, picked from a popover on desktop and a bottom sheet on phones.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="date-picker/Basic" title="Basic">
        Leave out <code>value</code> for an uncontrolled picker, or own the state with{' '}
        <code>value</code> and <code>onChange</code>. Values are native <code>Date</code>s at local
        midnight.
      </Example>
      <Example path="date-picker/Field" title="Field states">
        Label, helper text, error, disabled and read-only. These props are the same on every picker.
      </Example>
      <Example path="date-picker/Constraints" title="Constraints">
        <code>min</code>, <code>max</code> and <code>disabledDates</code> block days, and screen
        readers announce those days as unavailable.
      </Example>
      <Example path="date-picker/Locale" title="Locale and RTL">
        Month names, weekday order, digits and direction all come from <code>Intl</code>. RTL
        locales mirror the layout and the arrow keys.
      </Example>
      <Example path="date-picker/Forms" title="Forms">
        With <code>name</code>, a hidden input submits <code>YYYY-MM-DD</code>. Submit while empty:{' '}
        <code>required</code> stops the form and focuses the trigger.
      </Example>
      <Example path="date-picker/Customization" title="Customisation">
        <code>renderDay</code> replaces the day content, <code>formatValue</code> the trigger text,
        and <code>classNames</code>/<code>styles</code> reach every part by slot name. Library CSS
        lives in <code>@layer ric</code>, so your plain CSS always wins.
      </Example>
      <Example path="date-picker/ControlledOpen" title="Controlled open">
        <code>open</code> and <code>onOpenChange</code> put the popup under your control.
      </Example>
      <ApiReference
        tables={[
          { typeName: 'DatePickerProps', props },
          { typeName: 'DayRenderProps', props: dayProps },
        ]}
      />
    </>
  );
}
