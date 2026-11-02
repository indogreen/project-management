/** Locks or restores document body scrolling while drawers and modals are open. */
let activeLocks = 0;

export function lockBodyScroll(lock: boolean): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return;
  }

  const body = document.body;
  if (!body) {
    return;
  }

  if (lock) {
    activeLocks++;
    if (body.dataset.scrollLocked === 'true') {
      return;
    }

    const scrollY = window.scrollY;
    body.dataset.scrollLocked = 'true';
    body.dataset.scrollY = String(scrollY);
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    body.style.width = '100%';
    return;
  }

  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks > 0) {
    return;
  }

  if (body.dataset.scrollLocked !== 'true') {
    return;
  }

  const y = Number(body.dataset.scrollY || '0');
  body.style.position = '';
  body.style.top = '';
  body.style.left = '';
  body.style.right = '';
  body.style.overflow = '';
  body.style.width = '';
  delete body.dataset.scrollLocked;
  delete body.dataset.scrollY;
  window.scrollTo(0, y);
}
