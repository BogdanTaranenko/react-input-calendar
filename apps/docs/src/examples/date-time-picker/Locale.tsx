import { DateTimePicker } from '@b.taranenko/react-input-calendar';

const value = new Date();

export default function Locale() {
  return (
    <div className="demo-grid">
      <DateTimePicker label="en-US (12-hour)" locale="en-US" defaultValue={value} />
      <DateTimePicker label="en-GB (24-hour)" locale="en-GB" defaultValue={value} />
      <DateTimePicker
        label="de-DE, forced 12-hour"
        locale="de-DE"
        hourCycle={12}
        defaultValue={value}
      />
      <DateTimePicker label="العربية (RTL)" locale="ar-EG" defaultValue={value} />
    </div>
  );
}
