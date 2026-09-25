import { MultiDatePicker } from '@b.taranenko/react-input-calendar';

const today = new Date();
const days = [0, 2, 4].map(
  (offset) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset),
);

export default function Locale() {
  return (
    <div className="demo-row">
      <MultiDatePicker label="Español" locale="es-ES" defaultValue={days} />
      <MultiDatePicker label="اردو (RTL)" locale="ur-PK" defaultValue={days} />
    </div>
  );
}
