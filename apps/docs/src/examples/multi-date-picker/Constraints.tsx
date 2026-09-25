import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

const today = new Date();

export default function Constraints() {
  return (
    <MultiDatePicker
      label="Up to 3 weekdays, from today"
      min={today}
      maxSelected={3}
      disabledDates={{ dayOfWeek: [0, 6] }}
    />
  );
}
