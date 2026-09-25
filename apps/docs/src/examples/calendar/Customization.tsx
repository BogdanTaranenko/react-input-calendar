import { Calendar, type DayRenderProps } from '@b.taranenko/react-input-calendar';

// Nightly prices, keyed by day of the month.
const price = (date: Date) => 80 + ((date.getDate() * 7) % 40);

const renderDay = (day: DayRenderProps) =>
  day.disabled || day.outside ? (
    day.formatted
  ) : (
    <span className="demo-price-day">
      {day.formatted}
      <small>${price(day.date)}</small>
    </span>
  );

export default function Customization() {
  return (
    <Calendar
      mode="range"
      numberOfMonths={2}
      min={new Date()}
      renderDay={renderDay}
      classNames={{ dayButton: 'demo-price-button' }}
    />
  );
}
