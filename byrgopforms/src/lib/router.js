import { useEffect, useState } from 'react';

// Minimal client-side router for the byrgopforms SPA. Two real routes:
//   /        → registration (default)
//   /vamshi  → staff check-in
// The route survives browser refresh because it is derived from the URL
// pathname on every render (Vite dev + static hosts need a history fallback to
// index.html, handled in hosting config).

export function routeFromPathname(pathname) {
  const p = String(pathname || '/').split('?')[0];
  const t = p.replace(/\/+$/, '') || '/';
  if (t === '/vamshi') return 'checkin';
  return 'register';
}

export function currentPath() {
  return typeof window !== 'undefined'
    ? window.location.pathname + window.location.search
    : '/';
}

export function navigate(to) {
  if (typeof window === 'undefined') return;
  if (currentPath() !== to) {
    window.history.pushState({}, '', to);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

let listeners = [];

function notify() {
  const path = currentPath();
  for (const l of listeners) l(path);
}

export function useRoute() {
  const [path, setPath] = useState(currentPath());

  useEffect(() => {
    listeners.push(setPath);
    const onPop = () => notify();
    window.addEventListener('popstate', onPop);
    return () => {
      listeners = listeners.filter((l) => l !== setPath);
      window.removeEventListener('popstate', onPop);
    };
  }, []);

  return { path, route: routeFromPathname(path), navigate };
}