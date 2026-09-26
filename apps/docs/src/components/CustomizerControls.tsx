import { useId, type ReactNode } from 'react';

interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorControl({ label, value, onChange }: ColorControlProps) {
  const id = useId();
  return (
    <div className="control control-color">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
      <code>{value}</code>
    </div>
  );
}

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
}

export function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: RangeControlProps) {
  const id = useId();
  return (
    <div className="control">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value));
        }}
      />
      <output htmlFor={id}>
        {value}
        {unit}
      </output>
    </div>
  );
}

interface SelectControlProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function SelectControl({ label, value, options, onChange }: SelectControlProps) {
  const id = useId();
  return (
    <div className="control">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ControlGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="control-group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}
