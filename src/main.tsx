import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Monkey patch global para tornar a revogação de Blob URLs segura e evitar net::ERR_ABORTED
// Evita revogação enquanto o navegador ainda está usando o blob (download/decodificação/HMR)
if (typeof window !== 'undefined' && !(window as any).__SAFE_BLOB_PATCHED__) {
  (window as any).__SAFE_BLOB_PATCHED__ = true;
  const originalCreate = URL.createObjectURL.bind(URL);
  const originalRevoke = URL.revokeObjectURL.bind(URL);
  const DEV = (import.meta as any)?.env?.DEV ?? false;
  const BASE_DELAY_MS = DEV ? 2000 : 800; // atraso base para revogar
  const scheduled = new Map<string, number>();
  const inUseUntil = new Map<string, number>();
  const now = () => Date.now();

  const scheduleIdle = (fn: () => void, timeout: number) => {
    const ric = (window as any).requestIdleCallback;
    if (typeof ric === 'function') {
      ric(fn, { timeout });
    } else {
      setTimeout(fn, Math.max(200, Math.min(timeout, 3000)));
    }
  };

  // Flag opcional de debug: (window as any).__SAFE_BLOB_DEBUG__ = true;

  URL.createObjectURL = function (blob: any): string {
    const url = originalCreate(blob);
    // Pequena janela de "uso" após a criação
    inUseUntil.set(url, now() + (DEV ? 3000 : 1200));
    try { if ((window as any).__SAFE_BLOB_DEBUG__) console.debug('[safeBlob] create', url); } catch {}
    return url;
  };

  URL.revokeObjectURL = function (url: string): void {
    if (!url || !url.startsWith('blob:')) {
      try { originalRevoke(url as any); } catch {}
      return;
    }

    // Evitar re-agendamentos desnecessários
    if (scheduled.has(url)) return;

    // Aguardar janela mínima de uso
    const t = inUseUntil.get(url) ?? 0;
    const wait = Math.max(0, t - now());
    const delay = BASE_DELAY_MS + wait;

    const timer = window.setTimeout(() => {
      scheduled.delete(url);
      scheduleIdle(() => {
        try {
          originalRevoke(url);
          try { if ((window as any).__SAFE_BLOB_DEBUG__) console.debug('[safeBlob] revoked', url); } catch {}
        } catch {}
        inUseUntil.delete(url);
      }, DEV ? 2000 : 800);
    }, delay);

    scheduled.set(url, timer);
    try { if ((window as any).__SAFE_BLOB_DEBUG__) console.debug('[safeBlob] schedule revoke in', delay, 'ms', url); } catch {}
  };

  // Marcar cliques em <a href="blob:"> como "em uso" por uma pequena janela
  window.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement)?.closest?.('a[href^="blob:"]') as HTMLAnchorElement | null;
    if (a?.href) {
      inUseUntil.set(a.href, now() + (DEV ? 4000 : 1500));
      try { if ((window as any).__SAFE_BLOB_DEBUG__) console.debug('[safeBlob] anchor click', a.href); } catch {}
    }
  }, true);

  // Marcar mídia (video/audio) como "em uso" durante carregamento/decodificação
  const bumpOnEvent = (ev: Event) => {
    const el = ev.target as HTMLMediaElement;
    const src = (el && ('currentSrc' in el) ? (el as any).currentSrc : (el as any)?.src) as string | undefined;
    if (src && typeof src === 'string' && src.startsWith('blob:')) {
      inUseUntil.set(src, now() + (DEV ? 3000 : 1200));
      try { if ((window as any).__SAFE_BLOB_DEBUG__) console.debug('[safeBlob] media inUse', src); } catch {}
    }
  };
  window.addEventListener('loadstart', bumpOnEvent as any, true);
  window.addEventListener('loadeddata', bumpOnEvent as any, true);

  // Flush seguro ao ocultar a página (navegação)
  window.addEventListener('pagehide', () => {
    for (const [url, timer] of scheduled) {
      try { clearTimeout(timer); } catch {}
      try { originalRevoke(url); } catch {}
    }
    scheduled.clear();
    inUseUntil.clear();
  });
}

createRoot(document.getElementById('root')!).render(
 <App />
);
