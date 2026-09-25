import { Link } from '../router';
import { routes, sections } from '../routes';

interface SidebarProps {
  id: string;
  open: boolean;
  onNavigate: () => void;
}

export function Sidebar({ id, open, onNavigate }: SidebarProps) {
  return (
    <nav id={id} className="sidebar" data-open={open || undefined} aria-label="Documentation">
      {sections.map((section) => (
        <div key={section} className="nav-section">
          <h2>{section}</h2>
          <ul>
            {routes
              .filter((route) => route.section === section)
              .map((route) => (
                <li key={route.path}>
                  <Link to={route.path} onClick={onNavigate}>
                    {route.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
