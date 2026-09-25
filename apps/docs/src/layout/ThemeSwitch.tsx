import { setTheme, useTheme, type Theme } from '../theme';

const OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function ThemeSwitch() {
  const theme = useTheme();
  return (
    <div className="theme-switch" role="group" aria-label="Colour scheme">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => {
            setTheme(option.value);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
