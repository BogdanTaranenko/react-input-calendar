import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Field() {
  return (
    <div className="demo-grid">
      <DatePicker label="Check-in" description="The day you arrive." placeholder="Pick a day" />
      <DatePicker label="Deadline" error="Pick a day before the end of the month." />
      <DatePicker label="Disabled" defaultValue={new Date()} disabled />
      <DatePicker label="Read-only" defaultValue={new Date()} readOnly />
      <DatePicker label="Not clearable" defaultValue={new Date()} clearable={false} />
      <DatePicker label="No icon" icon={false} />
    </div>
  );
}
