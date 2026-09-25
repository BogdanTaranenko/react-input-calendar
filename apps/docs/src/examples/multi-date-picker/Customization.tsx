import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

export default function Customization() {
  return (
    <MultiDatePicker
      label="Custom trigger text"
      classNames={{ dayButton: 'demo-day' }}
      formatValue={(days) => (days.length === 1 ? '1 day off' : `${String(days.length)} days off`)}
    />
  );
}
