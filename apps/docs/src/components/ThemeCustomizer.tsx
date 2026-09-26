import { useState, type CSSProperties } from 'react';
import { Calendar, DatePicker } from '@b.taranenko/react-input-calendar';
import { tokenDefaults } from '../theming/defaults';
import {
  EMPTY_OVERRIDES,
  previewStyle,
  setOverride,
  type OverrideTarget,
} from '../theming/overrides';
import { buildThemeCss } from '../theming/theme-css';
import { toHex } from '../theming/tokens';
import { ThemeSwitch } from '../layout/ThemeSwitch';
import { useResolvedScheme } from '../theme';
import { CodeBlock } from './CodeBlock';
import { ColorControl, ControlGroup, RangeControl, SelectControl } from './CustomizerControls';

const CELL_SHAPES = [
  { value: '999px', label: 'Circle' },
  { value: '10px', label: 'Rounded square' },
  { value: '3px', label: 'Square' },
];

const FONTS = [
  { value: 'inherit', label: 'Page font' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif", label: 'Rounded' },
  { value: "Georgia, 'Times New Roman', serif", label: 'Serif' },
  { value: 'ui-monospace, Menlo, monospace', label: 'Monospace' },
];

const today = new Date();
const previewRange = {
  from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
  to: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
};

const EMPTY_CSS = '/* Change a control above; only the tokens you change appear here. */';

const px = (value: string | undefined) => Number.parseFloat(value ?? '') || 0;

export function ThemeCustomizer() {
  const [overrides, setOverrides] = useState(EMPTY_OVERRIDES);
  const scheme = useResolvedScheme();

  const current = (target: OverrideTarget, token: string) =>
    overrides[target][token] ??
    (target === 'dark' ? tokenDefaults.dark[token] : undefined) ??
    tokenDefaults.light[token] ??
    '';
  const set = (target: OverrideTarget, token: string) => (value: string) => {
    setOverrides((previous) => setOverride(previous, target, token, value, tokenDefaults));
  };
  const color = (target: OverrideTarget, token: string) =>
    toHex(current(target, token)) ?? '#000000';

  const shadowOff = current('light', '--ric-shadow') === 'none';
  const toggleShadow = () => {
    const value = (target: 'light' | 'dark') =>
      shadowOff ? (tokenDefaults[target]['--ric-shadow'] ?? '') : 'none';
    setOverrides((previous) =>
      setOverride(
        setOverride(previous, 'light', '--ric-shadow', value('light'), tokenDefaults),
        'dark',
        '--ric-shadow',
        value('dark'),
        tokenDefaults,
      ),
    );
  };

  const css = buildThemeCss(overrides, tokenDefaults);

  return (
    <div className="customizer">
      <form
        className="customizer-controls"
        aria-label="Theme controls"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <ControlGroup legend="Colour">
          <ColorControl
            label="Accent"
            value={color('shared', '--ric-accent')}
            onChange={set('shared', '--ric-accent')}
          />
          <ColorControl
            label="Surface, light"
            value={color('light', '--ric-surface')}
            onChange={set('light', '--ric-surface')}
          />
          <ColorControl
            label="Surface, dark"
            value={color('dark', '--ric-surface')}
            onChange={set('dark', '--ric-surface')}
          />
          <ColorControl
            label="Text, light"
            value={color('light', '--ric-text')}
            onChange={set('light', '--ric-text')}
          />
          <ColorControl
            label="Text, dark"
            value={color('dark', '--ric-text')}
            onChange={set('dark', '--ric-text')}
          />
        </ControlGroup>
        <ControlGroup legend="Shape">
          <RangeControl
            label="Radius"
            min={0}
            max={24}
            unit="px"
            value={px(current('shared', '--ric-radius'))}
            onChange={(value) => {
              set('shared', '--ric-radius')(`${String(value)}px`);
            }}
          />
          <SelectControl
            label="Cell shape"
            options={CELL_SHAPES}
            value={current('shared', '--ric-radius-cell')}
            onChange={set('shared', '--ric-radius-cell')}
          />
          <RangeControl
            label="Cell size"
            min={32}
            max={48}
            unit="px"
            value={px(current('shared', '--ric-cell-size'))}
            onChange={(value) => {
              set('shared', '--ric-cell-size')(`${String(value)}px`);
            }}
          />
          <div className="control control-check">
            <input
              id="customizer-shadow"
              type="checkbox"
              checked={!shadowOff}
              onChange={toggleShadow}
            />
            <label htmlFor="customizer-shadow">Shadow</label>
          </div>
        </ControlGroup>
        <ControlGroup legend="Type and motion">
          <SelectControl
            label="Font"
            options={FONTS}
            value={current('shared', '--ric-font')}
            onChange={set('shared', '--ric-font')}
          />
          <RangeControl
            label="Motion"
            min={0}
            max={600}
            step={20}
            unit="ms"
            value={px(current('shared', '--ric-duration'))}
            onChange={(value) => {
              set('shared', '--ric-duration')(`${String(value)}ms`);
            }}
          />
        </ControlGroup>
        <button
          type="button"
          className="demo-button"
          disabled={css === ''}
          onClick={() => {
            setOverrides(EMPTY_OVERRIDES);
          }}
        >
          Reset
        </button>
      </form>

      <div
        className="customizer-preview"
        style={previewStyle(overrides, tokenDefaults, scheme) as CSSProperties}
      >
        <div className="customizer-scheme">
          <span>Previewing the {scheme} scheme</span>
          <ThemeSwitch />
        </div>
        <DatePicker label="Open me: the popup follows too" defaultValue={today} />
        <Calendar mode="range" defaultValue={previewRange} />
      </div>

      <div className="customizer-output">
        <CodeBlock lang="css" code={css || EMPTY_CSS} copyLabel="Copy CSS" />
      </div>
    </div>
  );
}
