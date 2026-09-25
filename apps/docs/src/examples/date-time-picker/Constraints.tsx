import { DateTimePicker } from '@b.taranenko/react-input-calendar';

const now = new Date();
// `min` and `max` are exact moments: office hours today and tomorrow.
const min = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
const max = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 17, 30);

export default function Constraints() {
  return (
    <div className="demo-row">
      <DateTimePicker label="Office hours" min={min} max={max} minuteStep={30} />
      <DateTimePicker
        label="Default time 09:00"
        defaultTime={{ hours: 9, minutes: 0 }}
        minuteStep={15}
      />
    </div>
  );
}
