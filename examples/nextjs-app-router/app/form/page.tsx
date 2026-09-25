import { DatePicker } from '@b.taranenko/react-input-calendar';
import { submitDate } from './actions';

interface FormPageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function FormPage({ searchParams }: FormPageProps) {
  const { date } = await searchParams;
  return (
    <main>
      <h1>A server action</h1>
      <form action={submitDate}>
        <DatePicker label="Date" name="date" required />
        <button type="submit">Submit</button>
      </form>
      {typeof date === 'string' && <output data-testid="received">Received {date}</output>}
    </main>
  );
}
