import React from 'react';

/**
 * Cache de URLs criadas com contagem de referências para evitar revogação prematura
 */
type UrlEntry = { url: string; refs: number };
const urlCache = new WeakMap<File | ArrayBuffer, UrlEntry>();

/**
 * Set para rastrear URLs que precisam ser limpas (para revokeAll)
 */
const urlsToCleanup = new Set<string>();

/**
 * Revogação adiada para evitar net::ERR_ABORTED durante desmontagem de elementos
 */
function scheduleRevoke(url: string) {
  const doRevoke = () => {
    try {
      URL.revokeObjectURL(url);
      try { console.debug('[revokeObjectURL][scheduled] revoked', { url }); } catch {}
    } catch {}
  };

  // Usa requestIdleCallback quando disponível, senão timeout mínimo
  if (typeof (window as any) !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
    (window as any).requestIdleCallback(doRevoke, { timeout: 500 });
  } else {
    setTimeout(doRevoke, 0);
  }
}

/**
 * Converte File ou ArrayBuffer em blob URL com cache e cleanup baseado em referência
 */
export function toObjectURL(source: File | ArrayBuffer, mimeType?: string): string {
  // Verifica se já existe no cache
  const entry = urlCache.get(source);
  if (entry) {
    entry.refs += 1;
    // Log leve para depuração
    try { console.debug('[toObjectURL] reuse', { refs: entry.refs, url: entry.url, source: source instanceof File ? { name: source.name, size: source.size, type: source.type } : { type: 'ArrayBuffer', bytes: (source as ArrayBuffer).byteLength } }); } catch {}
    return entry.url;
  }

  let blob: Blob;
  
  if (source instanceof File) {
    // Se é um File, usa diretamente
    blob = source;
  } else if (source && typeof source === 'object' && source.constructor && source.constructor.name === 'ArrayBuffer') {
    // Se é ArrayBuffer, cria um Blob
    blob = new Blob([source], { type: mimeType || 'application/octet-stream' });
  } else {
    throw new Error('Tipo de source não suportado. Use File ou ArrayBuffer.');
  }

  // Cria a URL
  const url = URL.createObjectURL(blob);
  
  // Adiciona ao cache com uma referência inicial
  urlCache.set(source, { url, refs: 1 });
  
  // Adiciona à lista de cleanup total
  urlsToCleanup.add(url);

  try { console.debug('[toObjectURL] create', { url, refs: 1, source: source instanceof File ? { name: source.name, size: source.size, type: source.type } : { type: 'ArrayBuffer', bytes: (source as ArrayBuffer).byteLength } }); } catch {}
  
  return url;
}

/**
 * Revoga uma URL específica e remove da lista de cleanup
 * Observação: use com cautela. Prefira revokeObjectURLBySource para respeitar refcount.
 */
export function revokeObjectURL(url: string): void {
  try {
    // Revogação adiada para evitar abort durante detach/unmount
    scheduleRevoke(url);
  } finally {
    urlsToCleanup.delete(url);
    try { console.debug('[revokeObjectURL] scheduled', { url }); } catch {}
  }
}

/**
 * Libera a URL associada a um source específico respeitando contagem de referências
 */
export function revokeObjectURLBySource(source: File | ArrayBuffer): void {
  const entry = urlCache.get(source);
  if (!entry) return;

  if (entry.refs > 1) {
    entry.refs -= 1;
    try { console.debug('[revokeObjectURLBySource] release', { url: entry.url, refs: entry.refs, source: source instanceof File ? { name: source.name } : { type: 'ArrayBuffer' } }); } catch {}
    return;
  }

  // Última referência: agendar revogação e limpar
  try {
    scheduleRevoke(entry.url);
  } finally {
    urlCache.delete(source);
    urlsToCleanup.delete(entry.url);
    try { console.debug('[revokeObjectURLBySource] scheduled revoke', { url: entry.url, refs: 0, source: source instanceof File ? { name: source.name } : { type: 'ArrayBuffer' } }); } catch {}
  }
}

/**
 * Limpa todas as URLs criadas (útil para cleanup geral)
 */
export function revokeAllObjectURLs(): void {
  urlsToCleanup.forEach(url => {
    try { scheduleRevoke(url); } catch {}
  });
  urlsToCleanup.clear();
  // Não é possível limpar WeakMap diretamente, mas as entradas se perderão quando as chaves forem coletadas
  try { console.debug('[revokeAllObjectURLs] all scheduled'); } catch {}
}

/**
 * Hook para React que gerencia automaticamente o cleanup por referência
 */
export function useObjectURL(source: File | ArrayBuffer | null, mimeType?: string): string | null {
  const [url, setUrl] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }
    
    const objectUrl = toObjectURL(source, mimeType);
    setUrl(objectUrl);
    
    // Cleanup quando o componente desmonta ou source muda
    return () => {
      revokeObjectURLBySource(source);
    };
  }, [source, mimeType]);
  
  return url;
}

/**
 * Utilitário para verificar se uma URL é um object URL
 */
export function isObjectURL(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Converte diferentes tipos de source para URL utilizável
 */
export function sourceToURL(
  source: string | File | ArrayBuffer, 
  mimeType?: string
): string {
  if (typeof source === 'string') {
    // Se já é uma URL, retorna diretamente
    return source;
  }
  
  // Se é File ou ArrayBuffer, converte para object URL
  return toObjectURL(source, mimeType);
}

// Cleanup automático quando a página é descarregada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', revokeAllObjectURLs);
}