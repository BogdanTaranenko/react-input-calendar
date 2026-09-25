import { useEffect, useRef } from 'react';
import { Layout } from './layout/Layout';
import { NotFoundPage } from './pages/NotFound';
import { useRoute } from './router';
import { routes } from './routes';

export function App() {
  const path = useRoute();
  const route = routes.find((item) => item.path === path);
  const Page = route?.Page ?? NotFoundPage;
  const main = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = route?.path ? `${route.title} · react-input-calendar` : 'react-input-calendar';
    // A new page starts at the top, and screen readers hear its heading, like a real navigation.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    main.current?.querySelector('h1')?.focus();
  }, [route]);

  return (
    <Layout>
      <main id="main" ref={main} className="main" tabIndex={-1}>
        <Page key={path} />
      </main>
    </Layout>
  );
}
