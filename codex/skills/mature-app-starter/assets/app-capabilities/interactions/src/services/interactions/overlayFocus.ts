export type FocusReturn = (() => void) & { cancel(): void };
export type OverlayFocusOptions = {
  document?: Document | null;
  now?: () => number;
  triggerWindowMs?: number;
};

const triggerSelector = 'button, [role="button"], [role="tab"], [aria-haspopup]';
const overlaySelector = '[aria-modal="true"], dialog, [role="dialog"], [role="menu"], [role="listbox"]';
const unavailableSelector = '[inert], [hidden], [aria-hidden="true"], [aria-disabled="true"]';

/** One manager per document/app. Call dispose when its host is permanently removed. */
export function createOverlayFocusManager({
  document: owner = typeof document === 'undefined' ? null : document,
  now = Date.now,
  triggerWindowMs = 1500,
}: OverlayFocusOptions = {}) {
  if (!Number.isFinite(triggerWindowMs) || triggerWindowMs < 0)
    throw new Error('Invalid trigger window');
  let disposed = false;
  let watchers = 0;
  let invocation: { target: HTMLElement; restore: FocusReturn; time: number } | null = null;
  const pending = new Set<() => void>();

  function available(target: HTMLElement): boolean {
    if (!owner || !target.isConnected || target.ownerDocument !== owner ||
      target.matches(':disabled') || target.hasAttribute('disabled') || target.closest(unavailableSelector)) return false;
    for (let element: HTMLElement | null = target; element; element = element.parentElement) {
      const style = owner.defaultView?.getComputedStyle(element);
      if (style?.display === 'none' || style?.visibility === 'hidden' || style?.visibility === 'collapse') return false;
    }
    return true;
  }

  function capture(target: HTMLElement | null): FocusReturn {
    const containers: { element: HTMLElement; top: number; left: number }[] = [];
    if (target && owner && target !== owner.body) {
      for (let element = target.parentElement; element; element = element.parentElement) {
        if (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth)
          containers.push({ element, top: element.scrollTop, left: element.scrollLeft });
      }
    }
    let used = false;
    let cancelled = false;
    let frame: number | undefined;
    const view = owner?.defaultView;
    const cancel = () => {
      cancelled = true;
      if (frame !== undefined) view?.cancelAnimationFrame(frame);
      pending.delete(cancel);
    };
    const restore = () => {
      if (used || cancelled || disposed || !owner || !target || target === owner.body) return;
      used = true;
      const closingFocus = owner.activeElement;
      const finish = () => {
        pending.delete(cancel);
        frame = undefined;
        if (cancelled || disposed || !available(target)) return;
        // Hosts mount visible modal layers in stack order. Hidden/inert layers are excluded.
        const modal = Array.from(owner.querySelectorAll<HTMLElement>('[aria-modal="true"], dialog[open]'))
          .filter(element => element.getClientRects().length > 0 && available(element))
          .at(-1);
        if (modal && !modal.contains(target)) return;
        const active = owner.activeElement;
        // Preserve a destination chosen either before close or during the closing frame.
        if (active && active !== target && active !== owner.body &&
          (active !== closingFocus || !active.closest(overlaySelector))) return;
        target.focus({ preventScroll: true });
        // A refused focus must not scroll a different part of the application.
        if (owner.activeElement !== target) return;
        for (const { element, top, left } of containers) {
          if (!element.isConnected) continue;
          element.scrollTop = top;
          element.scrollLeft = left;
        }
      };
      if (view?.requestAnimationFrame) {
        pending.add(cancel);
        frame = view.requestAnimationFrame(finish);
      } else finish();
    };
    return Object.assign(restore, { cancel });
  }

  function remember(event: Event) {
    if (disposed || !owner) return;
    if (event.type === 'keydown') {
      const key = event as KeyboardEvent;
      if (!['Enter', ' '].includes(key.key) || key.metaKey || key.ctrlKey || key.altKey || key.repeat) return;
    }
    const source = event.target as Element | null;
    const target = typeof source?.closest === 'function' ? source.closest<HTMLElement>(triggerSelector) : null;
    invocation?.restore.cancel();
    invocation = target && typeof target.focus === 'function'
      ? { target, restore: capture(target), time: now() }
      : null;
  }

  function removeListeners() {
    owner?.removeEventListener('pointerdown', remember, true);
    owner?.removeEventListener('keydown', remember, true);
  }

  return {
    watchTriggers(): () => void {
      if (!owner || disposed) return () => {};
      if (watchers++ === 0) {
        owner.addEventListener('pointerdown', remember, true);
        owner.addEventListener('keydown', remember, true);
      }
      let released = false;
      return () => {
        if (released || disposed) return;
        released = true;
        if (--watchers === 0) {
          removeListeners();
          invocation?.restore.cancel();
          invocation = null;
        }
      };
    },
    captureReturnFocus(): FocusReturn {
      const previous = invocation;
      invocation = null;
      const age = previous ? now() - previous.time : Infinity;
      if (!disposed && previous?.target.isConnected && Number.isFinite(age) && age >= 0 && age < triggerWindowMs)
        return previous.restore;
      previous?.restore.cancel();
      const active = owner?.activeElement as HTMLElement | null;
      return capture(active && typeof active.focus === 'function' ? active : null);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      removeListeners();
      watchers = 0;
      invocation?.restore.cancel();
      invocation = null;
      for (const cancel of pending) cancel();
      pending.clear();
    },
  };
}
