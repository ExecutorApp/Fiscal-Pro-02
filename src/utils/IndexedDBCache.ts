/**
 * Sistema de Cache IndexedDB para Anexos CRM Empresas
 * Compatível com Chrome, Firefox e Edge
 * 
 * Estrutura do Banco:
 * - DB: crmEmpresasCache
 * - Stores: videos, audios, documents, forms
 * - Schema: {id, remoteId, title, category, mime, size, createdAt, sourceUrl, blob, thumb?, hash}
 */

// Tipos e interfaces
export interface CacheRecord {
  id?: number;
  remoteId: string;
  title: string;
  category: 'videos' | 'audios' | 'documents' | 'forms';
  mime: string;
  size: number;
  createdAt: Date;
  sourceUrl: string;
  blob: Blob;
  thumb?: Blob;
  hash: string;
}

export interface CacheUsage {
  totalSize: number;
  totalFiles: number;
  byCategory: {
    videos: { count: number; size: number };
    audios: { count: number; size: number };
    documents: { count: number; size: number };
    forms: { count: number; size: number };
  };
}

export interface SyncProgress {
  current: number;
  total: number;
  currentFile: string;
  category: string;
}

export interface AttachmentSelectors {
  videos: string;
  audios: string;
  documents: string;
  forms: string;
}

export interface SyncOptions {
  selectors?: Partial<AttachmentSelectors>;
  onProgress?: (progress: SyncProgress) => void;
  onError?: (error: Error, file: string) => void;
}

const DB_NAME = 'crmEmpresasCache';
const DB_VERSION = 1;
const STORES = ['videos', 'audios', 'documents', 'forms'] as const;

/**
 * Classe principal para gerenciamento do cache IndexedDB
 */
export class IndexedDBCache {
  private db: IDBDatabase | null = null;

  /**
   * Abre conexão com o banco de dados IndexedDB
   * Compatível com Chrome, Firefox e Edge
   */
  async openDb(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    // Verificar suporte ao IndexedDB
    if (!window.indexedDB) {
      throw new Error('IndexedDB não é suportado neste navegador');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = request.error;
        if (error?.name === 'QuotaExceededError') {
          reject(new Error('Cota de armazenamento excedida. Libere espaço e tente novamente.'));
        } else if (error?.name === 'VersionError') {
          reject(new Error('Versão do banco incompatível. Limpe o cache do navegador.'));
        } else {
          reject(new Error(`Falha ao abrir IndexedDB: ${error?.message || 'Erro desconhecido'}`));
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        
        // Tratar eventos de erro da conexão
        this.db.onerror = (event) => {
          console.error('Erro na conexão IndexedDB:', event);
        };
        
        // Tratar fechamento inesperado
        this.db.onclose = () => {
          console.warn('Conexão IndexedDB foi fechada inesperadamente');
          this.db = null;
        };
        
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        try {
          // Criar stores para cada categoria
          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              const store = db.createObjectStore(storeName, { 
                keyPath: 'id', 
                autoIncrement: true 
              });
              
              // Índices para busca eficiente
              store.createIndex('remoteId', 'remoteId', { unique: true });
              store.createIndex('hash', 'hash', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
              store.createIndex('size', 'size', { unique: false });
            }
          });
        } catch (error) {
          console.error('Erro ao criar estrutura do banco:', error);
          reject(new Error('Falha ao inicializar estrutura do banco'));
        }
      };

      // Timeout para evitar travamento
      setTimeout(() => {
        if (request.readyState === 'pending') {
          reject(new Error('Timeout ao abrir IndexedDB'));
        }
      }, 10000);
    });
  }

  /**
   * Calcula hash SHA256 de um blob
   */
  private async calculateHash(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verifica se arquivo já existe no cache (por remoteId ou hash)
   */
  private async fileExists(category: string, remoteId: string, hash: string): Promise<boolean> {
    const db = await this.openDb();
    const transaction = db.transaction([category], 'readonly');
    const store = transaction.objectStore(category);
    
    // Verifica por remoteId primeiro
    const remoteIdIndex = store.index('remoteId');
    const remoteIdRequest = remoteIdIndex.get(remoteId);
    
    return new Promise((resolve) => {
      remoteIdRequest.onsuccess = () => {
        if (remoteIdRequest.result) {
          resolve(true);
          return;
        }
        
        // Se não encontrou por remoteId, verifica por hash
        const hashIndex = store.index('hash');
        const hashRequest = hashIndex.get(hash);
        
        hashRequest.onsuccess = () => {
          resolve(!!hashRequest.result);
        };
        
        hashRequest.onerror = () => resolve(false);
      };
      
      remoteIdRequest.onerror = () => resolve(false);
    });
  }

  /**
   * Salva arquivo no cache
   */
  async saveFile(record: Omit<CacheRecord, 'id' | 'hash'>): Promise<number> {
    try {
      const hash = await this.calculateHash(record.blob);
      const fullRecord: Omit<CacheRecord, 'id'> = { ...record, hash };
      
      // Verifica se já existe
      const exists = await this.fileExists(record.category, record.remoteId, hash);
      if (exists) {
        throw new Error(`Arquivo já existe no cache: ${record.title}`);
      }
      
      const db = await this.openDb();
      const transaction = db.transaction([record.category], 'readwrite');
      const store = transaction.objectStore(record.category);
      
      return new Promise((resolve, reject) => {
        const request = store.add(fullRecord);
        
        request.onsuccess = () => {
          resolve(request.result as number);
        };
        
        request.onerror = () => {
          const error = request.error;
          if (error?.name === 'QuotaExceededError') {
            reject(new Error('Cota de armazenamento excedida. Libere espaço e tente novamente.'));
          } else if (error?.name === 'DataError') {
            reject(new Error('Dados inválidos para salvar no cache.'));
          } else {
            reject(new Error(`Falha ao salvar arquivo: ${error?.message || 'Erro desconhecido'}`));
          }
        };
        
        // Timeout para operação
        setTimeout(() => {
          if (request.readyState === 'pending') {
            reject(new Error('Timeout ao salvar arquivo'));
          }
        }, 30000);
      });
    } catch (error) {
      throw new Error(`Erro ao acessar banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Lista arquivos por categoria
   */
  async listFiles(category?: string): Promise<CacheRecord[]> {
    const db = await this.openDb();
    const categories = category ? [category] : STORES;
    const results: CacheRecord[] = [];
    
    for (const cat of categories) {
      const transaction = db.transaction([cat], 'readonly');
      const store = transaction.objectStore(cat);
      
      const files = await new Promise<CacheRecord[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = () => {
          reject(new Error(`Erro ao listar arquivos: ${request.error?.message}`));
        };
      });
      
      results.push(...files);
    }
    
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtém arquivo específico por ID
   */
  async getFile(id: number, category: string): Promise<CacheRecord | null> {
    const db = await this.openDb();
    const transaction = db.transaction([category], 'readonly');
    const store = transaction.objectStore(category);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao obter arquivo: ${request.error?.message}`));
      };
    });
  }

  /**
   * Remove arquivo específico
   */
  async deleteFile(id: number, category: string): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction([category], 'readwrite');
    const store = transaction.objectStore(category);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Erro ao deletar arquivo: ${request.error?.message}`));
      };
    });
  }

  /**
   * Limpa todo o cache
   */
  async clearAll(): Promise<void> {
    const db = await this.openDb();
    const transaction = db.transaction(STORES, 'readwrite');
    
    const promises = STORES.map(storeName => {
      return new Promise<void>((resolve, reject) => {
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Erro ao limpar ${storeName}`));
      });
    });
    
    await Promise.all(promises);
  }

  /**
   * Obtém estatísticas de uso do cache
   */
  async getUsage(): Promise<CacheUsage> {
    const files = await this.listFiles();
    
    const usage: CacheUsage = {
      totalSize: 0,
      totalFiles: files.length,
      byCategory: {
        videos: { count: 0, size: 0 },
        audios: { count: 0, size: 0 },
        documents: { count: 0, size: 0 },
        forms: { count: 0, size: 0 }
      }
    };
    
    files.forEach(file => {
      usage.totalSize += file.size;
      usage.byCategory[file.category].count++;
      usage.byCategory[file.category].size += file.size;
    });
    
    return usage;
  }

  /**
   * Seletores padrão para varredura de anexos
   */
  private getDefaultSelectors(): AttachmentSelectors {
    return {
      videos: '[data-category="videos"] .attachment-item, .video-attachment',
      audios: '[data-category="audios"] .attachment-item, .audio-attachment',
      documents: '[data-category="documents"] .attachment-item, .document-attachment',
      forms: '[data-category="forms"] .attachment-item, .form-attachment'
    };
  }

  /**
   * Extrai informações do elemento de anexo
   */
  private extractAttachmentInfo(element: Element, category: string): {
    remoteId: string;
    title: string;
    sourceUrl: string;
    mime: string;
  } | null {
    try {
      // Tenta extrair informações do elemento
      const titleElement = element.querySelector('.attachment-title, .file-name, [data-title]');
      const linkElement = element.querySelector('a[href], [data-url]') as HTMLAnchorElement;
      
      const title = titleElement?.textContent?.trim() || 
                   element.getAttribute('data-title') || 
                   'Arquivo sem nome';
      
      const sourceUrl = linkElement?.href || 
                       element.getAttribute('data-url') || 
                       element.getAttribute('src') || '';
      
      if (!sourceUrl) {
        console.warn('URL não encontrada para anexo:', title);
        return null;
      }
      
      // Extrai remoteId da URL ou usa hash da URL
      const urlParams = new URL(sourceUrl, window.location.origin).searchParams;
      const remoteId = urlParams.get('id') || 
                      urlParams.get('fileId') || 
                      element.getAttribute('data-id') || 
                      btoa(sourceUrl).slice(0, 16);
      
      // Determina MIME type baseado na extensão ou categoria
      let mime = 'application/octet-stream';
      const extension = sourceUrl.split('.').pop()?.toLowerCase();
      
      if (category === 'videos') {
        mime = extension === 'mp4' ? 'video/mp4' : 
               extension === 'webm' ? 'video/webm' : 
               extension === 'avi' ? 'video/avi' : 'video/mp4';
      } else if (category === 'audios') {
        mime = extension === 'mp3' ? 'audio/mpeg' : 
               extension === 'wav' ? 'audio/wav' : 
               extension === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
      } else if (category === 'documents') {
        mime = extension === 'pdf' ? 'application/pdf' : 
               extension === 'doc' ? 'application/msword' : 
               extension === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 
               'application/pdf';
      } else if (category === 'forms') {
        mime = 'application/json';
      }
      
      return { remoteId, title, sourceUrl, mime };
    } catch (error) {
      console.error('Erro ao extrair informações do anexo:', error);
      return null;
    }
  }

  /**
   * Faz download do arquivo e retorna blob
   */
  private async downloadFile(url: string): Promise<{ blob: Blob; size: number }> {
    try {
      // Verificar se a URL é válida
      const urlObj = new URL(url);
      
      // Timeout para download
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const response = await fetch(url, { 
        signal: controller.signal,
        mode: 'cors', // Permitir CORS
        cache: 'no-cache' // Evitar cache do navegador
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar arquivo: ${response.status} ${response.statusText}`);
      }
      
      // Verificar tipo de conteúdo
      const contentType = response.headers.get('content-type');
      if (!contentType) {
        console.warn('Tipo de conteúdo não especificado para:', url);
      }
      
      const blob = await response.blob();
      
      // Verificar tamanho do arquivo
      if (blob.size === 0) {
        throw new Error('Arquivo vazio ou corrompido');
      }
      
      if (blob.size > 100 * 1024 * 1024) { // 100MB limit
        throw new Error('Arquivo muito grande (máximo 100MB)');
      }
      
      return { blob, size: blob.size };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de rede ao baixar arquivo. Verifique sua conexão.');
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Download cancelado por timeout (60s)');
      } else if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erro desconhecido ao baixar arquivo');
      }
    }
  }

  /**
   * Sincroniza anexos da página atual
   */
  async syncAttachments(options: SyncOptions = {}): Promise<{
    success: number;
    skipped: number;
    errors: number;
    totalSize: number;
  }> {
    const selectors = { ...this.getDefaultSelectors(), ...options.selectors };
    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      totalSize: 0
    };
    
    // Coleta todos os anexos de todas as categorias
    const allAttachments: Array<{
      element: Element;
      category: keyof AttachmentSelectors;
    }> = [];
    
    for (const [category, selector] of Object.entries(selectors)) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        allAttachments.push({
          element,
          category: category as keyof AttachmentSelectors
        });
      });
    }
    
    console.log(`Encontrados ${allAttachments.length} anexos para sincronizar`);
    
    // Processa cada anexo
    for (let i = 0; i < allAttachments.length; i++) {
      const { element, category } = allAttachments[i];
      
      try {
        // Extrai informações do anexo
        const attachmentInfo = this.extractAttachmentInfo(element, category);
        if (!attachmentInfo) {
          results.skipped++;
          continue;
        }
        
        const { remoteId, title, sourceUrl, mime } = attachmentInfo;
        
        // Reporta progresso
        if (options.onProgress) {
          options.onProgress({
            current: i + 1,
            total: allAttachments.length,
            currentFile: title,
            category
          });
        }
        
        // Baixa o arquivo
        const { blob, size } = await this.downloadFile(sourceUrl);
        
        // Calcula hash para verificar duplicatas
        const hash = await this.calculateHash(blob);
        
        // Verifica se já existe
        const exists = await this.fileExists(category, remoteId, hash);
        if (exists) {
          console.log(`Arquivo já existe no cache: ${title}`);
          results.skipped++;
          continue;
        }
        
        // Salva no cache
        await this.saveFile({
          remoteId,
          title,
          category,
          mime,
          size,
          createdAt: new Date(),
          sourceUrl,
          blob
        });
        
        results.success++;
        results.totalSize += size;
        
        console.log(`Arquivo salvo no cache: ${title} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        
      } catch (error) {
        console.error(`Erro ao processar anexo:`, error);
        results.errors++;
        
        if (options.onError) {
          options.onError(
            error instanceof Error ? error : new Error('Erro desconhecido'),
            attachmentInfo?.title || 'Arquivo desconhecido'
          );
        }
      }
      
      // Pequena pausa para não sobrecarregar o navegador
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('Sincronização concluída:', results);
    return results;
  }

  /**
   * Fecha conexão com o banco
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instância singleton
export const cacheInstance = new IndexedDBCache();