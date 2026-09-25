import { Example } from '../components/Example';
import { props } from '../props/DateTimePickerProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function DateTimePickerPage() {
  return (
    <>
      <PageHeader title="DateTimePicker">
        A day and a time of day, in the locale's 12- or 24-hour clock.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="date-time-picker/Basic" title="Basic">
        Every day or time change is committed through <code>onChange</code>. The popup closes on
        Done, Escape or an outside press.
      </Example>
      <Example path="date-time-picker/Constraints" title="Constraints">
        <code>min</code> and <code>max</code> are exact moments, and times are clamped into them.{' '}
        <code>minuteStep</code> sets the minute options.
      </Example>
      <Example path="date-time-picker/Locale" title="Locale and clock">
        The clock follows the locale; <code>hourCycle</code> overrides it.
      </Example>
      <Example path="date-time-picker/Forms" title="Forms">
        <code>name</code> submits local <code>YYYY-MM-DDTHH:mm</code>.
      </Example>
      <Example path="date-time-picker/Customization" title="Customisation" />
      <Example path="date-time-picker/ControlledOpen" title="Controlled open" />
      <ApiReference tables={[{ typeName: 'DateTimePickerProps', props }]} />
    </>
  );
}
