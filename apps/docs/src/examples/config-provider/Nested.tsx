import { CalendarConfigProvider, DatePicker } from '@b.taranenko/react-input-calendar';

export default function Nested() {
  return (
    <CalendarConfigProvider colorScheme="dark" classNames={{ trigger: 'demo-trigger' }}>
      <div className="demo-row">
        <DatePicker label="Outer defaults" />
        {/* A nested provider overrides only the keys it sets; a prop beats both. */}
        <CalendarConfigProvider colorScheme="light">
          <DatePicker label="Light again" />
          <DatePicker label="Prop wins" colorScheme="dark" />
        </CalendarConfigProvider>
      </div>
    </CalendarConfigProvider>
  );
}
