import { Calendar } from '@b.taranenko/react-input-calendar';

export default function Locale() {
  return (
    <div className="demo-row">
      <Calendar locale="ko-KR" />
      <Calendar locale="ar-EG" />
    </div>
  );
}
