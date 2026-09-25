import { DatePicker } from '@b.taranenko/react-input-calendar';

export function TailwindFixture() {
  return (
    <div className="flex flex-col gap-6">
      <DatePicker label="Library look" />
      <DatePicker label="Utility override" classNames={{ trigger: 'rounded-none' }} />
    </div>
  );
}
