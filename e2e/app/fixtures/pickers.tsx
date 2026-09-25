import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  MultiDatePicker,
  type RangePreset,
} from '@b.taranenko/react-input-calendar';

const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

const PRESETS: RangePreset[] = [
  {
    label: 'Last 7 days',
    value: () => ({ from: addDays(new Date(), -6), to: new Date() }),
  },
  {
    label: 'October',
    value: () => ({ from: new Date(2026, 9, 1), to: new Date(2026, 9, 31) }),
  },
];

export function DatePickerFixture() {
  return <DatePicker label="Date" />;
}

export function DateRangeFixture() {
  return <DateRangePicker label="Stay" presets={PRESETS} startName="from" endName="to" />;
}

export function MultiDateFixture() {
  return <MultiDatePicker label="Days" name="days" />;
}

export function DateTimeFixture() {
  return <DateTimePicker label="Meeting" name="meeting" />;
}

export function FieldFixture() {
  return (
    <DatePicker
      label="Arrival"
      description="The day you land."
      error="Pick a day in September."
    />
  );
}

export function DisabledFixture() {
  return <DatePicker label="Locked" defaultValue={new Date(2026, 8, 24)} disabled />;
}

export function MinMaxFixture() {
  return (
    <DatePicker
      label="Within limits"
      defaultValue={new Date(2026, 8, 15)}
      min={new Date(2026, 8, 10)}
      max={new Date(2026, 8, 20)}
    />
  );
}

export function RtlFixture() {
  return (
    <div dir="rtl" lang="ar">
      <DatePicker label="التاريخ" locale="ar" defaultValue={new Date(2026, 8, 15)} />
    </div>
  );
}
