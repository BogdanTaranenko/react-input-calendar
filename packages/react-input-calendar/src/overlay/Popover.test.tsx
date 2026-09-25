import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useRef, useState, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Calendar } from '../calendar/Calendar';
import type { Rect } from './compute-position';
import { Popover, type CloseReason, type PopoverProps } from './Popover';
import { useModalDialog } from './use-modal-dialog';

type HarnessProps = Partial<Omit<PopoverProps, 'anchorRef' | 'open' | 'children'>> & {
  initiallyOpen?: boolean;
  withInitialFocus?: boolean;
  children?: ReactNode;
};

/** A trigger plus a popover that closes itself whenever it asks to, like the pickers will. */
function Harness({ initiallyOpen = false, withInitialFocus = false, children, ...props }: HarnessProps) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Trigger
      </button>
      <Popover
        label="Choose date"
        {...props}
        open={open}
        anchorRef={anchorRef}
        initialFocusRef={withInitialFocus ? initialFocusRef : undefined}
        onClose={(reason: CloseReason) => {
          props.onClose?.(reason);
          setOpen(false);
        }}
      >
        {children ?? (
          <>
            <button type="button">First</button>
            <button ref={initialFocusRef} type="button">
              Middle
            </button>
            <button type="button">Last</button>
          </>
        )}
      </Popover>
    </>
  );
}

const dialog = () => document.querySelector('dialog') as HTMLDialogElement;
const trigger = () => screen.getByRole('button', { name: 'Trigger' });
const nextFrame = () =>
  act(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          resolve();
        });
      }),
  );

function mockRect(element: Element, rect: Omit<Rect, 'right' | 'bottom'>) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  });
}

/** jsdom lays nothing out, so `offsetWidth`/`offsetHeight` are 0 unless given. */
function mockSize(element: HTMLElement, size: { width: number; height: number }) {
  vi.spyOn(element, 'offsetWidth', 'get').mockReturnValue(size.width);
  vi.spyOn(element, 'offsetHeight', 'get').mockReturnValue(size.height);
}

/** Gives the trigger and the dialog real-looking boxes as soon as the dialog appears. */
function mockLayout(anchor: Omit<Rect, 'right' | 'bottom'>) {
  vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
    mockRect(trigger(), anchor);
    mockRect(this, { left: 0, top: 0, width: 300, height: 350 });
    mockSize(this, { width: 300, height: 350 });
    this.setAttribute('open', '');
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Popover — rendering', () => {
  it('renders no dialog on the server, even when open', () => {
    const html = renderToString(<Harness initiallyOpen />);
    expect(html).toContain('Trigger');
    expect(html).not.toContain('<dialog');
  });

  it('renders nothing while closed', () => {
    render(<Harness />);
    expect(dialog()).toBeNull();
  });

  it('renders a labelled modal dialog in place, with the popover and surface classes', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Harness classNames={{ popover: 'my-popover' }} styles={{ popover: { color: 'red' } }} />,
    );
    await user.click(trigger());
    const element = dialog();
    expect(container).toContainElement(element);
    expect(element).toHaveAttribute('aria-modal', 'true');
    expect(element).toHaveAttribute('data-state', 'open');
    expect(element).toHaveClass('ric-popover', 'ric-surface', 'my-popover');
    expect(element).toHaveStyle({ color: 'rgb(255, 0, 0)' });
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Choose date');
  });

  it('prefers aria-labelledby over aria-label', async () => {
    const user = userEvent.setup();
    render(
      <>
        <span id="heading">Start date</span>
        <Harness labelledBy="heading" />
      </>,
    );
    await user.click(trigger());
    expect(dialog()).toHaveAttribute('aria-labelledby', 'heading');
    expect(dialog()).not.toHaveAttribute('aria-label');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Start date');
  });
});

describe('Popover — modal behaviour', () => {
  it('calls showModal once on open', async () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(showModal).toHaveBeenCalledOnce();
    await user.click(screen.getByRole('button', { name: 'Middle' }));
    expect(showModal).toHaveBeenCalledOnce();
  });

  it('focuses initialFocusRef on open, or else the first tabbable element', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness withInitialFocus />);
    await user.click(trigger());
    expect(screen.getByRole('button', { name: 'Middle' })).toHaveFocus();
    unmount();

    render(<Harness />);
    await user.click(trigger());
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('wraps Tab from the last element to the first, and Shift+Tab back', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();
  });

  it('keeps focus on the dialog itself when it holds nothing tabbable', async () => {
    const user = userEvent.setup();
    render(<Harness>Nothing to focus</Harness>);
    await user.click(trigger());
    expect(dialog()).toHaveFocus();
    await user.tab();
    expect(dialog()).toHaveFocus();
  });

  it('closes on Escape and returns focus to the anchor', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(dialog()).toBeNull();
    expect(trigger()).toHaveFocus();
  });

  it('stays open when a child already handled Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness onClose={onClose}>
        <input
          aria-label="Handles Escape"
          onKeyDown={(event) => {
            if (event.key === 'Escape') event.preventDefault();
          }}
        />
      </Harness>,
    );
    await user.click(trigger());
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
  });

  it('stays open when Escape leaves the calendar month view, then closes on the next Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Harness onClose={onClose}>
        <Calendar locale="en-US" defaultMonth={new Date(2026, 8, 1)} />
      </Harness>,
    );
    await user.click(trigger());
    await user.click(screen.getByRole('button', { name: 'September 2026, Choose month' }));
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    expect(within(dialog()).getByRole('grid')).toHaveAccessibleName('September 2026');
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });

  it('never lets the browser cancel the dialog behind React', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      dialog().dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
  });

  it('reports a close the browser forced as escape, but not its own close', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(trigger());
    act(() => {
      dialog().close();
    });
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
    expect(dialog()).toBeNull();
  });
});

describe('Popover — asynchronous close events', () => {
  // Browsers fire `close` in a later task, unlike the synchronous jsdom stub.
  function closeLater() {
    vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      setTimeout(() => {
        this.dispatchEvent(new Event('close'));
      });
    });
  }
  const nextTask = () =>
    act(
      () =>
        new Promise<void>((resolve) => {
          setTimeout(resolve);
        }),
    );

  it('stays open when mounted open under StrictMode, whose effect re-run closes and reopens it', async () => {
    closeLater();
    const onClose = vi.fn();
    render(
      <StrictMode>
        <Harness onClose={onClose} initiallyOpen />
      </StrictMode>,
    );
    await nextTask();
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog()).not.toBeNull();
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('does not report its own close when the dialog stays mounted (useModalDialog alone)', async () => {
    closeLater();
    const onClose = vi.fn();
    function Mounted({ open }: { open: boolean }) {
      const ref = useRef<HTMLDialogElement>(null);
      const handlers = useModalDialog(ref, { open, onClose });
      return (
        <dialog ref={ref} {...handlers}>
          <button type="button">Inside</button>
        </dialog>
      );
    }
    const { rerender } = render(<Mounted open />);
    await nextTask();
    rerender(<Mounted open={false} />);
    await nextTask();
    expect(dialog().open).toBe(false);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('still reports a close the browser forced', async () => {
    closeLater();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(trigger());
    act(() => {
      dialog().close();
    });
    await nextTask();
    expect(onClose).toHaveBeenCalledExactlyOnceWith('escape');
  });
});

describe('Popover — pressing outside', () => {
  it('closes on a press on the dialog outside its surface, but not on one inside it', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Harness onClose={onClose} />);
    await user.click(trigger());
    mockRect(dialog(), { left: 100, top: 100, width: 300, height: 350 });

    // jsdom defaults isPrimary to false; a real mouse or first finger reports true.
    const press = { isPrimary: true };
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Middle' }), { clientX: 5, clientY: 5, ...press });
    fireEvent.pointerDown(dialog(), { clientX: 150, clientY: 150, ...press });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(dialog(), { clientX: 50, clientY: 500, ...press });
    expect(onClose).toHaveBeenCalledExactlyOnceWith('outside');
    expect(trigger()).toHaveFocus();
  });
});

describe('Popover — position', () => {
  it('places itself below the anchor with inline fixed styles as soon as it opens', async () => {
    mockLayout({ left: 100, top: 100, width: 200, height: 40 });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(dialog().style.position).toBe('fixed');
    expect(dialog().style.margin).toBe('0px');
    expect(dialog().style.inset).toBe('auto');
    expect(dialog().style.left).toBe('100px');
    expect(dialog().style.top).toBe('148px');
    expect(dialog()).toHaveAttribute('data-placement', 'bottom-start');
  });

  it('follows placement and dir, flipping near the bottom of the viewport', async () => {
    mockLayout({ left: 400, top: 600, width: 200, height: 40 });
    const user = userEvent.setup();
    render(<Harness placement="bottom-start" dir="rtl" />);
    await user.click(trigger());
    expect(dialog().style.left).toBe('300px');
    expect(dialog().style.top).toBe('242px');
    expect(dialog()).toHaveAttribute('data-placement', 'top-start');
  });

  it('sizes itself by layout, not by the scaled box of its open animation', async () => {
    vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (this: HTMLDialogElement) {
      mockRect(trigger(), { left: 400, top: 600, width: 200, height: 40 });
      // Mid scale-in (0.96): the transformed box is smaller than the laid-out 300×350.
      mockRect(this, { left: 6, top: 7, width: 288, height: 336 });
      mockSize(this, { width: 300, height: 350 });
      this.setAttribute('open', '');
    });
    const user = userEvent.setup();
    render(<Harness placement="bottom-start" dir="rtl" />);
    await user.click(trigger());
    expect(dialog().style.left).toBe('300px');
    expect(dialog().style.top).toBe('242px');
  });

  it('repositions on scroll and resize in the next frame, and stops after closing', async () => {
    mockLayout({ left: 100, top: 100, width: 200, height: 40 });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());

    mockRect(trigger(), { left: 150, top: 50, width: 200, height: 40 });
    fireEvent.scroll(document.body);
    await nextFrame();
    expect(dialog().style.left).toBe('150px');
    expect(dialog().style.top).toBe('98px');

    mockRect(trigger(), { left: 170, top: 60, width: 200, height: 40 });
    fireEvent(window, new Event('resize'));
    await nextFrame();
    expect(dialog().style.left).toBe('170px');

    const frame = vi.spyOn(window, 'requestAnimationFrame');
    await user.keyboard('{Escape}');
    fireEvent(window, new Event('resize'));
    fireEvent.scroll(document.body);
    expect(frame).not.toHaveBeenCalled();
  });

  it('observes both elements for size changes and disconnects on close', async () => {
    const observe = vi.fn<(element: Element) => void>();
    const disconnect = vi.fn();
    let notify: () => void = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          notify = callback;
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
    mockLayout({ left: 100, top: 100, width: 200, height: 40 });
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(trigger());
    expect(observe.mock.calls.map(([element]) => element)).toEqual([trigger(), dialog()]);

    mockRect(trigger(), { left: 120, top: 100, width: 200, height: 40 });
    notify();
    await nextFrame();
    expect(dialog().style.left).toBe('120px');

    await user.keyboard('{Escape}');
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
