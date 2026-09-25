import { DateRangePicker } from '@b.taranenko/react-input-calendar';

export default function Customization() {
  return (
    <div className="demo-row">
      <DateRangePicker label="One month" numberOfMonths={1} />
      <DateRangePicker
        label="Short trigger text"
        classNames={{ trigger: 'demo-trigger' }}
        formatValue={(range, locale) => {
          const format = (date: Date) =>
            date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
          return range.to ? `${format(range.from)} → ${format(range.to)}` : format(range.from);
        }}
      />
    </div>
  );
}
