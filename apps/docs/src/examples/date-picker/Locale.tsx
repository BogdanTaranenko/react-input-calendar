import { DatePicker } from '@b.taranenko/react-input-calendar';

export default function Locale() {
  const value = new Date();
  return (
    <div className="demo-grid">
      <DatePicker label="Deutsch" locale="de-DE" defaultValue={value} />
      <DatePicker label="日本語" locale="ja-JP" defaultValue={value} />
      <DatePicker label="العربية (RTL)" locale="ar-EG" defaultValue={value} />
      <DatePicker label="US, week starts Monday" locale="en-US" weekStartsOn={1} />
    </div>
  );
}
