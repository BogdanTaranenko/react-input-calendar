import { DatePicker } from '@b.taranenko/react-input-calendar';
import '@b.taranenko/react-input-calendar/styles.css';

export default function Uncontrolled() {
  // The picker keeps its own value; `name` submits it with a surrounding <form>.
  return <DatePicker label="Date" name="date" defaultValue={new Date()} />;
}
