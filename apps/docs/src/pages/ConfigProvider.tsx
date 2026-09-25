import { Example } from '../components/Example';
import { props } from '../props/CalendarConfigProviderProps';
import { ApiReference } from './ApiReference';
import { PageHeader } from './PageHeader';

export function ConfigProviderPage() {
  return (
    <>
      <PageHeader title="CalendarConfigProvider">
        App-wide defaults for every picker and calendar below it. Component props still win.
      </PageHeader>
      <h2>Examples</h2>
      <Example path="config-provider/AppDefaults" title="App defaults">
        Set the locale, week start and translated labels once.
      </Example>
      <Example path="config-provider/Nested" title="Nesting">
        Providers merge per key, with the closest one winning. A component's own{' '}
        <code>classNames</code> add to the provider's.
      </Example>
      <ApiReference tables={[{ typeName: 'CalendarConfigProviderProps', props }]} />
    </>
  );
}
