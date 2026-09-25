import { Example } from '../components/Example';
import { props } from '../props/MultiDatePickerProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function MultiDatePickerPage() {
  return (
    <>
      <PageHeader title="MultiDatePicker">
        Any number of separate days. Each click toggles a day, and the popup stays open until Done.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="multi-date-picker/Basic" title="Basic">
        <code>onChange</code> receives the days sorted ascending.
      </Example>
      <Example path="multi-date-picker/Constraints" title="Constraints">
        With <code>maxSelected</code> reached, other days cannot be added until one is removed.
      </Example>
      <Example path="multi-date-picker/Locale" title="Locale and RTL" />
      <Example path="multi-date-picker/Forms" title="Forms">
        <code>name</code> submits one field per day; read them with <code>formData.getAll()</code>.
      </Example>
      <Example path="multi-date-picker/Customization" title="Customisation" />
      <Example path="multi-date-picker/ControlledOpen" title="Controlled open" />
      <ApiReference tables={[{ typeName: 'MultiDatePickerProps', props }]} />
    </>
  );
}
