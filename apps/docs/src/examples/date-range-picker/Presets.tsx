import { DateRangePicker, type RangePreset } from '@b.taranenko/react-input-calendar';

const day = (year: number, month: number, date: number) => new Date(year, month, date);

// `value` runs on every click, so "last 7 days" always counts from the current day.
const presets: RangePreset[] = [
  {
    label: 'Last 7 days',
    value: () => {
      const now = new Date();
      return { from: day(now.getFullYear(), now.getMonth(), now.getDate() - 6), to: now };
    },
  },
  {
    label: 'Last 30 days',
    value: () => {
      const now = new Date();
      return { from: day(now.getFullYear(), now.getMonth(), now.getDate() - 29), to: now };
    },
  },
  {
    label: 'This month',
    value: () => {
      const now = new Date();
      return {
        from: day(now.getFullYear(), now.getMonth(), 1),
        to: day(now.getFullYear(), now.getMonth() + 1, 0),
      };
    },
  },
  {
    label: 'Last month',
    value: () => {
      const now = new Date();
      return {
        from: day(now.getFullYear(), now.getMonth() - 1, 1),
        to: day(now.getFullYear(), now.getMonth(), 0),
      };
    },
  },
];

export default function Presets() {
  return <DateRangePicker label="Report period" presets={presets} />;
}
