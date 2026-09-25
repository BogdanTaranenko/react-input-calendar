import { Example } from '../components/Example';
import { props } from '../props/DateRangePickerProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function DateRangePickerPage() {
  return (
    <>
      <PageHeader title="DateRangePicker">
        A start and an end day, with a hover preview of the range and two months side by side.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="date-range-picker/Basic" title="Basic">
        The first click sets <code>from</code> and leaves <code>to</code> as <code>null</code>; the
        second click completes the range and closes the popup.
      </Example>
      <Example path="date-range-picker/Constraints" title="Constraints">
        <code>minDays</code> and <code>maxDays</code> count both ends. Disabled days cannot be an
        end, but a range may run across them.
      </Example>
      <Example path="date-range-picker/Locale" title="Locale and RTL" />
      <Example path="date-range-picker/Forms" title="Forms">
        <code>startName</code> and <code>endName</code> submit two <code>YYYY-MM-DD</code> fields.
      </Example>
      <Example path="date-range-picker/Customization" title="Customisation">
        <code>numberOfMonths</code> takes 1 to 3. By default the popover shows two and the sheet on
        phones one.
      </Example>
      <Example path="date-range-picker/ControlledOpen" title="Controlled open" />
      <Example path="date-range-picker/Presets" title="Presets">
        Copy this list as a starting point. Each <code>value</code> runs when clicked, so relative
        ranges stay current. The preset matching the value is marked active.
      </Example>
      <Example path="date-range-picker/PresetsGerman" title="Presets in German">
        You write the labels, so presets work in any language. Intl covers the dates, and{' '}
        <code>labels</code> covers the few built-in strings.
      </Example>
      <ApiReference tables={[{ typeName: 'DateRangePickerProps', props }]} />
    </>
  );
}
