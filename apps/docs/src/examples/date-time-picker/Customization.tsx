import { DateTimePicker } from '@b.taranenko/react-input-calendar';

export default function Customization() {
  return (
    <DateTimePicker
      label="Styled time columns"
      classNames={{ timeOption: 'demo-time-option', doneButton: 'demo-done' }}
      formatValue={(date, locale) =>
        date.toLocaleString(locale, { weekday: 'short', hour: 'numeric', minute: '2-digit' })
      }
    />
  );
}
