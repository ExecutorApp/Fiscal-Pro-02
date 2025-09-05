import React from 'react';

/**
 * Cache de URLs criadas para evitar vazamentos de memória
 */
const urlCache = new WeakMap<File | ArrayBuffer, string>();

/**
 * Set para rastrear URLs que precisam ser limpas
 */
const urlsToCleanup = new Set<string>();

/**
 * Converte File ou ArrayBuffer em blob URL com cache e cleanup automático
 */
export function toObjectURL(source: File | ArrayBuffer, mimeType?: string): string {
  // Verifica se já existe no cache
  const cachedUrl = urlCache.get(source);
  if (cachedUrl) {
    return cachedUrl;
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
  
  // Adiciona ao cache
  urlCache.set(source, url);
  
  // Adiciona à lista de cleanup
  urlsToCleanup.add(url);
  
  return url;
}

/**
 * Revoga uma URL específica e remove do cache
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
  urlsToCleanup.delete(url);
}

/**
 * Revoga a URL associada a um source específico
 */
export function revokeObjectURLBySource(source: File | ArrayBuffer): void {
  const url = urlCache.get(source);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(source);
    urlsToCleanup.delete(url);
  }
}

/**
 * Limpa todas as URLs criadas (útil para cleanup geral)
 */
export function revokeAllObjectURLs(): void {
  urlsToCleanup.forEach(url => {
    URL.revokeObjectURL(url);
  });
  urlsToCleanup.clear();
}

/**
 * Hook para React que gerencia automaticamente o cleanup
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