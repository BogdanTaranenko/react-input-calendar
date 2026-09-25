import { PropsTable } from '../components/PropsTable';
import type { PropDoc } from '../props/types';

interface ApiReferenceProps {
  tables: { typeName: string; props: PropDoc[] }[];
}

export function ApiReference({ tables }: ApiReferenceProps) {
  return (
    <section className="api" aria-labelledby="api">
      <h2 id="api">API</h2>
      {tables.map((table) => (
        <PropsTable key={table.typeName} typeName={table.typeName} props={table.props} />
      ))}
    </section>
  );
}
