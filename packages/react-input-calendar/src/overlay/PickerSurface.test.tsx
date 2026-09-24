import { act, render } from '@testing-library/react';
import { useContext, useRef, type ReactNode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CalendarConfigProvider } from '../core/config-context';
import { PickerSurface } from './PickerSurface';
import { SurfaceContext } from './surface-context';

/** `matchMedia` that matches only the given query, or every query with `'all'`. */
function stubViewport(matchingQuery: string | null) {
  const matchMedia = vi.fn((media: string) => ({
    matches: matchingQuery === 'all' || media === matchingQuery,
    media,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  vi.stubGlobal('matchMedia', matchMedia);
  return matchMedia;
}

function SurfaceKind() {
  const surface = useContext(SurfaceContext);
  return <span data-testid="kind">{surface?.isSheet ? 'sheet' : 'popover'}</span>;
}

/** A viewport whose width the test can change; narrow means below 640px. */
function stubLiveViewport(narrow: boolean) {
  let matches = narrow;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (media: string) => ({
    get matches() {
      return media === '(max-width: 639.98px)' && matches;
    },
    media,
    addEventListener: (_: 'change', listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_: 'change', listener: () => void) => {
      listeners.delete(listener);
    },
  }));
  return (next: boolean) => {
    matches = next;
    act(() => {
      listeners.forEach((listener) => {
        listener();
      });
    });
  };
}

function Harness({
  mobileBreakpoint,
  open = true,
}: {
  mobileBreakpoint?: number | false;
  open?: boolean;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={anchorRef} type="button">
        Trigger
      </button>
      <PickerSurface
        open={open}
        onClose={() => undefined}
        anchorRef={anchorRef}
        label="Choose date"
        mobileBreakpoint={mobileBreakpoint}
      >
        <SurfaceKind />
      </PickerSurface>
    </>
  );
}

const dialog = () => document.querySelector('dialog') as HTMLDialogElement;
const kind = () => document.querySelector('[data-testid="kind"]')?.textContent;

function renderIn(ui: ReactNode, providerBreakpoint?: number | false) {
  return render(
    <CalendarConfigProvider mobileBreakpoint={providerBreakpoint}>{ui}</CalendarConfigProvider>,
  );
}

describe('PickerSurface', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a popover when the viewport is at least 640px wide', () => {
    stubViewport(null);
    render(<Harness />);
    expect(dialog()).toHaveClass('ric-popover');
    expect(kind()).toBe('popover');
  });

  it('is a bottom sheet below the default 640px breakpoint', () => {
    stubViewport('(max-width: 639.98px)');
    render(<Harness />);
    expect(dialog()).toHaveClass('ric-backdrop');
    expect(kind()).toBe('sheet');
  });

  it('uses the prop breakpoint over the provider one', () => {
    stubViewport('(max-width: 479.98px)');
    renderIn(<Harness mobileBreakpoint={480} />, 900);
    expect(kind()).toBe('sheet');
  });

  it('falls back to the provider breakpoint', () => {
    stubViewport('(max-width: 899.98px)');
    renderIn(<Harness />, 900);
    expect(kind()).toBe('sheet');
  });

  it('never becomes a sheet when the breakpoint is false', () => {
    stubViewport('all');
    render(<Harness mobileBreakpoint={false} />);
    expect(dialog()).toHaveClass('ric-popover');
    expect(kind()).toBe('popover');
  });

  it('lets the prop re-enable a sheet the provider turned off', () => {
    stubViewport('(max-width: 639.98px)');
    renderIn(<Harness mobileBreakpoint={640} />, false);
    expect(kind()).toBe('sheet');
  });

  it('keeps the surface it opened with while the viewport crosses the breakpoint', () => {
    const resize = stubLiveViewport(true);
    const { rerender } = render(<Harness />);
    const opened = dialog();
    expect(opened).toHaveClass('ric-backdrop');

    resize(false);
    expect(dialog()).toBe(opened);
    expect(kind()).toBe('sheet');

    // The next opening follows the viewport again.
    rerender(<Harness open={false} />);
    rerender(<Harness />);
    expect(dialog()).toHaveClass('ric-popover');
    expect(kind()).toBe('popover');
  });

  it('follows the viewport while closed', () => {
    const resize = stubLiveViewport(false);
    const { rerender } = render(<Harness open={false} />);
    resize(true);
    rerender(<Harness />);
    expect(dialog()).toHaveClass('ric-backdrop');
  });

  it('chooses the surface of a picker hydrated open from the real viewport, not the server guess', async () => {
    stubLiveViewport(true);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Harness />);
    document.body.append(container);
    const root = await act(() => hydrateRoot(container, <Harness />));
    expect(dialog()).toHaveClass('ric-backdrop');
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
