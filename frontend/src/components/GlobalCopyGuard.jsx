import { useEffect, useRef } from 'react';

// Form controls must keep native behaviour: typing, pasting, selecting and
// editing the user's own data (email, phone, name, company, website, dropdowns).
const EDITABLE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [contenteditable=""]';

function isEditable(node) {
  return !!node && typeof node.closest === 'function' && !!node.closest(EDITABLE_SELECTOR);
}

/**
 * Website-wide content copy deterrent for the PUBLIC frontend only.
 *
 * - Right-click / context menu (and mobile long-press) is disabled on content.
 * - Text selection and text dragging are disabled on content.
 * - Copy / cut is blocked on content (covers Ctrl/Cmd+C, Ctrl/Cmd+X,
 *   Select-All + Copy, and context-menu Copy/Cut).
 * - Ctrl/Cmd+U (view source) and Ctrl/Cmd+S (save page) are blocked.
 *
 * Form controls (input, textarea, select, contenteditable) are untouched:
 * type, paste, select, edit and copy of user-entered data all keep working.
 *
 * Clean deterrent only - no debugger loops, freezes, crashes or alerts.
 */
export default function GlobalCopyGuard({ children }) {
  const root = useRef(null);

  useEffect(() => {
    // Keys with no DOM event we can intercept (view source / save page).
    const onKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = (e.key || '').toLowerCase();
      if (key === 'u' || key === 's') {
        e.preventDefault();
      }
    };

    // Copy/cut is suppressed unless it originates from a form field, where the
    // user is working with their own entered data.
    const blockCopyCut = (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onContextMenu = (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onDragStart = (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    const onSelectStart = (e) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('copy', blockCopyCut, true);
    document.addEventListener('cut', blockCopyCut, true);
    document.addEventListener('contextmenu', onContextMenu, true);
    document.addEventListener('dragstart', onDragStart, true);
    document.addEventListener('selectstart', onSelectStart, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('copy', blockCopyCut, true);
      document.removeEventListener('cut', blockCopyCut, true);
      document.removeEventListener('contextmenu', onContextMenu, true);
      document.removeEventListener('dragstart', onDragStart, true);
      document.removeEventListener('selectstart', onSelectStart, true);
    };
  }, []);

  return (
    <div ref={root} className="global-copy-guard">
      {children}
    </div>
  );
}