import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useControllableState } from './use-controllable-state';

interface Props {
  value?: number | null | undefined;
  onChange?: ((value: number | null) => void) | undefined;
}

function setup(initialProps: Props) {
  return renderHook(
    (props: Props) =>
      useControllableState<number | null>({
        value: props.value,
        defaultValue: 1,
        onChange: props.onChange,
      }),
    { initialProps },
  );
}

describe('useControllableState', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts at defaultValue and updates itself when uncontrolled', () => {
    const onChange = vi.fn();
    const { result } = setup({ onChange });
    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1](2);
    });
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('follows the value prop and only reports changes when controlled', () => {
    const onChange = vi.fn();
    const { result, rerender } = setup({ value: 5, onChange });
    expect(result.current[0]).toBe(5);

    act(() => {
      result.current[1](6);
    });
    expect(result.current[0]).toBe(5);
    expect(onChange).toHaveBeenCalledExactlyOnceWith(6);

    rerender({ value: 6, onChange });
    expect(result.current[0]).toBe(6);
  });

  it('treats null as a controlled value, not as "uncontrolled"', () => {
    const { result } = setup({ value: null });
    act(() => {
      result.current[1](3);
    });
    expect(result.current[0]).toBeNull();
  });

  it('skips onChange when the next value is the current one', () => {
    const onChange = vi.fn();
    const { result } = setup({ value: 5, onChange });
    act(() => {
      result.current[1](5);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works without an onChange handler', () => {
    const { result } = setup({});
    act(() => {
      result.current[1](4);
    });
    expect(result.current[0]).toBe(4);
  });

  it('warns once per switch between uncontrolled and controlled', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = setup({});

    rerender({ value: 2 });
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.lastCall?.[0]).toMatch(/from uncontrolled to controlled/);

    rerender({ value: 3 });
    expect(warn).toHaveBeenCalledOnce();

    rerender({});
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.lastCall?.[0]).toMatch(/from controlled to uncontrolled/);
  });
});
