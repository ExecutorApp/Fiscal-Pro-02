/**
 * Módulo para gerenciamento de imagens locais usando IndexedDB
 * Suporta JPEG e PNG com fallback para Data URL
 * Sem dependências externas - apenas APIs nativas do navegador
 */

// Tipos para o sistema de imagens
export interface ImageMetadata {
  id: string;
  name: string;
  type: 'image/jpeg' | 'image/png' | string;
  size: number;
  storageKey: string;
  createdAt: string;
  dataUrl?: string; // Fallback para quando IndexedDB falhar
}

export interface ImageBlob {
  storageKey: string;
  blob: Blob;
}

// Configurações do banco
const DB_NAME = 'FiscalProImages';
const DB_VERSION = 1;
const STORE_BLOBS = 'images:blobs';
const STORE_META = 'images:meta';

// Cache para conexão do banco
let dbInstance: IDBDatabase | null = null;

/**
 * Inicializa o IndexedDB com as stores necessárias
 */
export const initializeDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erro ao abrir IndexedDB:', request.error);
      reject(new Error('Falha ao inicializar banco de dados local'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store para blobs das imagens
      if (!db.objectStoreNames.contains(STORE_BLOBS)) {
        const blobStore = db.createObjectStore(STORE_BLOBS, { keyPath: 'storageKey' });
        blobStore.createIndex('storageKey', 'storageKey', { unique: true });
      }
      
      // Store para metadados das imagens
      if (!db.objectStoreNames.contains(STORE_META)) {
        const metaStore = db.createObjectStore(STORE_META, { keyPath: 'id' });
        metaStore.createIndex('createdAt', 'createdAt', { unique: false });
        metaStore.createIndex('storageKey', 'storageKey', { unique: true });
      }
    };
  });
};

/**
 * Detecta o tipo de imagem pela assinatura binária (magic numbers)
 */
export const detectImageTypeBySignature = async (file: File): Promise<{ type: string | null; isSupported: boolean }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      if (!arrayBuffer) {
        resolve({ type: null, isSupported: false });
        return;
      }
      
      const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
      
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        resolve({ type: 'image/jpeg', isSupported: true });
        return;
      }
      
      // PNG: 89 50 4E 47 0D 0A 1A 0A
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
          bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A) {
        resolve({ type: 'image/png', isSupported: true });
        return;
      }
      
      resolve({ type: null, isSupported: false });
    };
    
    reader.onerror = () => resolve({ type: null, isSupported: false });
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
};

/**
 * Valida se um arquivo é uma imagem suportada
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];
  
  if (!validTypes.includes(file.type)) {
    console.warn(`Tipo de arquivo não suportado: ${file.type}`);
    return false;
  }
  
  // Verificar tamanho (máximo 15MB)
  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    console.warn(`Arquivo muito grande: ${file.size} bytes (máximo: ${maxSize})`);
    return false;
  }
  
  return true;
};

/**
 * Valida arquivo de imagem com detecção robusta de tipo
 */
export const validateImageFileRobust = async (file: File): Promise<{ isValid: boolean; detectedType: string | null }> => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png'];
  
  // Verificar tamanho primeiro
  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    console.warn(`Arquivo muito grande: ${file.size} bytes (máximo: ${maxSize})`);
    return { isValid: false, detectedType: null };
  }
  
  // Verificar por MIME type
  let isValidByMime = validTypes.includes(file.type);
  
  // Se MIME type não for válido, tentar detectar por assinatura binária
  if (!isValidByMime) {
    const signature = await detectImageTypeBySignature(file);
    if (signature.isSupported && signature.type) {
      return { isValid: true, detectedType: signature.type };
    }
  }
  
  return { isValid: isValidByMime, detectedType: file.type || null };
};

/**
 * Salva uma imagem no IndexedDB com fallback para Data URL
 */
export const saveImage = async (file: File): Promise<ImageMetadata> => {
  if (!validateImageFile(file)) {
    throw new Error('Arquivo de imagem inválido');
  }

  const id = crypto.randomUUID();
  const storageKey = `img:${id}`;
  const createdAt = new Date().toISOString();
  
  const metadata: ImageMetadata = {
    id,
    name: file.name,
    type: file.type as 'image/jpeg' | 'image/png',
    size: file.size,
    storageKey,
    createdAt
  };

  try {
    const db = await initializeDB();
    
    // Salvar blob
    const blobData: ImageBlob = {
      storageKey,
      blob: file
    };
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_BLOBS], 'readwrite');
      const store = transaction.objectStore(STORE_BLOBS);
      const request = store.add(blobData);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Salvar metadados
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.add(metadata);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Imagem salva com sucesso: ${file.name}`);
    return metadata;
    
  } catch (error) {
    console.warn('IndexedDB falhou, usando fallback Data URL:', error);
    
    // Fallback: converter para Data URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    
    const metadataWithFallback: ImageMetadata = {
      ...metadata,
      dataUrl
    };
    
    // Salvar no localStorage como fallback
    try {
      const existingMeta = JSON.parse(localStorage.getItem(STORE_META) || '[]');
      existingMeta.push(metadataWithFallback);
      localStorage.setItem(STORE_META, JSON.stringify(existingMeta));
      
      console.log(`✅ Imagem salva com fallback Data URL: ${file.name}`);
      return metadataWithFallback;
    } catch (storageError) {
      throw new Error('Falha ao salvar imagem: IndexedDB e localStorage indisponíveis');
    }
  }
};

/**
 * Lista todas as imagens salvas, ordenadas por data de criação (mais recentes primeiro)
 */
export const listImages = async (): Promise<ImageMetadata[]> => {
  try {
    const db = await initializeDB();
    
    const images = await new Promise<ImageMetadata[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readonly');
      const store = transaction.objectStore(STORE_META);
      const index = store.index('createdAt');
      const request = index.getAll();
      
      request.onsuccess = () => {
        const results = request.result || [];
        // Ordenar por data de criação (mais recentes primeiro)
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
    
    return images;
    
  } catch (error) {
    console.warn('Erro ao listar do IndexedDB, tentando localStorage:', error);
    
    // Fallback: ler do localStorage
    try {
      const stored = localStorage.getItem(STORE_META);
      if (stored) {
        const images: ImageMetadata[] = JSON.parse(stored);
        images.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return images;
      }
    } catch (storageError) {
      console.error('Erro ao ler localStorage:', storageError);
    }
    
    return [];
  }
};

/**
 * Busca metadados de imagem pelo storageKey
 */
export const getImageMetadataByStorageKey = async (storageKey: string): Promise<ImageMetadata | null> => {
  try {
    const images = await listImages();
    const foundImage = images.find(img => img.storageKey === storageKey);
    return foundImage || null;
  } catch (error) {
    console.error('Erro ao buscar metadados por storageKey:', error);
    return null;
  }
};

/**
 * Recupera o Blob de uma imagem e gera Object URL
 */
export const getImageURL = async (metadata: ImageMetadata): Promise<string> => {
  console.log('🔍 [GETIMAGEURL DEBUG] Iniciando getImageURL:', {
    name: metadata.name,
    storageKey: metadata.storageKey,
    hasDataUrl: !!metadata.dataUrl
  });
  
  // Se tem Data URL (fallback), usar diretamente
  if (metadata.dataUrl) {
    console.log('✅ [GETIMAGEURL DEBUG] Usando dataUrl diretamente');
    return metadata.dataUrl;
  }
  
  // Se é um storageKey de teste/fallback, retornar imagem de teste
  if (metadata.storageKey.includes('test') || metadata.storageKey.includes('fallback')) {
    console.log('✅ [GETIMAGEURL DEBUG] Usando imagem de teste para storageKey:', metadata.storageKey);
    return '/test-image.jpg';
  }
  
  try {
    console.log('🔍 [GETIMAGEURL DEBUG] Inicializando DB...');
    const db = await initializeDB();
    console.log('✅ [GETIMAGEURL DEBUG] DB inicializado');
    
    console.log('🔍 [GETIMAGEURL DEBUG] Buscando blob para storageKey:', metadata.storageKey);
    const blobData = await Promise.race([
      new Promise<ImageBlob | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_BLOBS], 'readonly');
        const store = transaction.objectStore(STORE_BLOBS);
        const request = store.get(metadata.storageKey);
        
        request.onsuccess = () => {
          console.log('🔍 [GETIMAGEURL DEBUG] Resultado da busca:', request.result);
          resolve(request.result || null);
        };
        request.onerror = () => {
          console.log('❌ [GETIMAGEURL DEBUG] Erro na busca:', request.error);
          reject(request.error);
        };
      }),
      // Timeout de 3 segundos para evitar travamento
      new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na busca do blob')), 3000);
      })
    ]);
    
    if (!blobData) {
      console.log('❌ [GETIMAGEURL DEBUG] Blob não encontrado, usando fallback');
      return '/test-image.jpg';
    }
    
    console.log('✅ [GETIMAGEURL DEBUG] Blob encontrado, criando Object URL');
    // Criar Object URL
    const objectUrl = URL.createObjectURL(blobData.blob);
    console.log('✅ [GETIMAGEURL DEBUG] Object URL criado:', objectUrl);
    return objectUrl;
    
  } catch (error) {
    console.log('❌ [GETIMAGEURL DEBUG] Erro geral, usando fallback:', error);
    return '/test-image.jpg';
  }
};

/**
 * Libera um Object URL da memória
 */
export const revokeImageURL = (url: string): void => {
  if (url && url.startsWith('blob:')) {
    const doRevoke = () => {
      try {
        URL.revokeObjectURL(url);
        // Log opcional (silencioso em prod)
        try { console.debug('[revokeImageURL][scheduled] revoked', url); } catch {}
      } catch {}
    };

    // Usa requestIdleCallback quando disponível, senão timeout mínimo
    if (typeof (window as any) !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
      (window as any).requestIdleCallback(doRevoke, { timeout: 500 });
    } else {
      setTimeout(doRevoke, 0);
    }
  }
};

/**
 * Remove uma imagem do banco de dados
 */
export const removeImage = async (metadata: ImageMetadata): Promise<void> => {
  try {
    const db = await initializeDB();
    
    // Remover blob
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_BLOBS], 'readwrite');
      const store = transaction.objectStore(STORE_BLOBS);
      const request = store.delete(metadata.storageKey);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Remover metadados
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.delete(metadata.id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log(`✅ Imagem removida: ${metadata.name}`);
    
  } catch (error) {
    console.warn('Erro ao remover do IndexedDB, tentando localStorage:', error);
    
    // Fallback: remover do localStorage
    try {
      const stored = localStorage.getItem(STORE_META);
      if (stored) {
        const images: ImageMetadata[] = JSON.parse(stored);
        const filtered = images.filter(img => img.id !== metadata.id);
        localStorage.setItem(STORE_META, JSON.stringify(filtered));
        console.log(`✅ Imagem removida do fallback: ${metadata.name}`);
      }
    } catch (storageError) {
      throw new Error('Falha ao remover imagem: IndexedDB e localStorage indisponíveis');
    }
  }
};

/**
 * Migra itens antigos que podem ter apenas o nome do arquivo
 */
export const migrateOldItems = async (oldItems: any[]): Promise<ImageMetadata[]> => {
  const migratedItems: ImageMetadata[] = [];
  
  for (const item of oldItems) {
    // Se o item já tem storageKey, está no formato novo
    if (item.storageKey && item.id && item.type) {
      migratedItems.push(item as ImageMetadata);
      continue;
    }
    
    // Item antigo - marcar como corrompido
    console.warn(`Item corrompido encontrado: ${item.name || item.label || 'Desconhecido'}`);
    
    // Criar entrada de migração com dados limitados
    const migratedItem: ImageMetadata = {
      id: item.id || crypto.randomUUID(),
      name: item.name || item.label || 'Arquivo Corrompido',
      type: 'image/jpeg', // Assumir JPEG por padrão
      size: 0,
      storageKey: `corrupted:${Date.now()}`,
      createdAt: new Date().toISOString(),
      dataUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiNGRjAwMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI0ZGRUVFRSIvPgo8L3N2Zz4K' // Ícone de erro em SVG
    };
    
    migratedItems.push(migratedItem);
  }
  
  return migratedItems;
};

/**
 * Limpa todos os dados de imagens (útil para testes)
 */
export const clearAllImages = async (): Promise<void> => {
  try {
    const db = await initializeDB();
    
    // Limpar blobs
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_BLOBS], 'readwrite');
      const store = transaction.objectStore(STORE_BLOBS);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Limpar metadados
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_META], 'readwrite');
      const store = transaction.objectStore(STORE_META);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Todos os dados de imagens foram limpos');
    
  } catch (error) {
    console.warn('Erro ao limpar IndexedDB, limpando localStorage:', error);
    localStorage.removeItem(STORE_META);
  }
};

/**
 * Obtém estatísticas de uso do armazenamento
 */
export const getStorageStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
  oldestImage?: string;
  newestImage?: string;
}> => {
  try {
    const images = await listImages();
    
    const totalImages = images.length;
    const totalSize = images.reduce((sum, img) => sum + img.size, 0);
    const oldestImage = images.length > 0 ? images[images.length - 1].createdAt : undefined;
    const newestImage = images.length > 0 ? images[0].createdAt : undefined;
    
    return {
      totalImages,
      totalSize,
      oldestImage,
      newestImage
    };
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return {
      totalImages: 0,
      totalSize: 0
    };
  }
};