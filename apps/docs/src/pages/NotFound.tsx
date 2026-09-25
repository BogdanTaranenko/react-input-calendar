import { href } from '../router';
import { PageHeader } from './PageHeader';

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found">There is no page at this address.</PageHeader>
      <p>
        <a href={href('')}>Go to the overview</a>
      </p>
    </>
  );
}
