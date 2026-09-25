import { DatePicker, type DayRenderProps } from '@b.taranenko/react-input-calendar';

// Days with something on; a dot marks them.
const busy = new Set([3, 11, 17, 24]);

const renderDay = (day: DayRenderProps) => (
  <>
    {day.formatted}
    {!day.outside && busy.has(day.date.getDate()) && (
      <span className="demo-dot" aria-hidden="true" />
    )}
  </>
);

export default function Customization() {
  return (
    <div className="demo-grid">
      <DatePicker label="renderDay" renderDay={renderDay} />
      <DatePicker
        label="formatValue"
        defaultValue={new Date()}
        formatValue={(date, locale) =>
          date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
        }
      />
      <DatePicker
        label="classNames"
        classNames={{ trigger: 'demo-trigger', dayButton: 'demo-day' }}
      />
      <DatePicker
        label="styles and a forced dark scheme"
        colorScheme="dark"
        styles={{ popover: { borderRadius: 20 } }}
      />
    </div>
  );
}
