/**
 * Componente de Gerenciamento de Cache IndexedDB
 * Interface para salvar, listar e gerenciar anexos em cache
 */

import React, { useState, useEffect } from 'react';
import { Download, Trash2, HardDrive, FileText, Video, Music, File, RefreshCw, AlertCircle } from 'lucide-react';
import { cacheInstance, CacheUsage, SyncProgress, CacheRecord } from '../utils/IndexedDBCache';

interface CacheManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SyncState {
  isRunning: boolean;
  progress: SyncProgress | null;
  results: {
    success: number;
    skipped: number;
    errors: number;
    totalSize: number;
  } | null;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ isOpen, onClose }) => {
  const [usage, setUsage] = useState<CacheUsage | null>(null);
  const [files, setFiles] = useState<CacheRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [syncState, setSyncState] = useState<SyncState>({
    isRunning: false,
    progress: null,
    results: null
  });
  const [error, setError] = useState<string | null>(null);

  // Carrega dados do cache
  const loadCacheData = async () => {
    try {
      setError(null);
      
      // Verificar se o IndexedDB está disponível
      if (!window.indexedDB) {
        throw new Error('IndexedDB não é suportado neste navegador');
      }
      
      const [cacheUsage, cacheFiles] = await Promise.all([
        cacheInstance.getUsage(),
        cacheInstance.listFiles(selectedCategory === 'all' ? undefined : selectedCategory)
      ]);
      
      setUsage(cacheUsage);
      setFiles(cacheFiles);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dados do cache';
      setError(errorMessage);
      
      // Log para debugging
      console.error('Erro ao carregar cache:', {
        error: err,
        timestamp: new Date().toISOString(),
        indexedDBSupported: !!window.indexedDB
      });
    }
  };

  // Carrega dados quando o modal abre ou categoria muda
  useEffect(() => {
    if (isOpen) {
      loadCacheData();
    }
  }, [isOpen, selectedCategory]);

  // Inicia sincronização de anexos
  const handleSyncAttachments = async () => {
    setSyncState({
      isRunning: true,
      progress: null,
      results: null
    });
    setError(null);

    try {
      // Verificar quota antes de iniciar
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const usedMB = (estimate.usage || 0) / (1024 * 1024);
        const quotaMB = (estimate.quota || 0) / (1024 * 1024);
        const availableMB = quotaMB - usedMB;
        
        if (availableMB < 50) { // Menos de 50MB disponível
          throw new Error(`Espaço insuficiente. Disponível: ${availableMB.toFixed(1)}MB`);
        }
      }
      
      const results = await cacheInstance.syncAttachments({
        onProgress: (progress) => {
          setSyncState(prev => ({ ...prev, progress }));
        },
        onError: (error, file) => {
          console.error(`Erro ao processar ${file}:`, error);
        },
        selectors: {
          container: '.anexos-container',
          items: '.anexo-item',
          title: '.anexo-title',
          url: '.anexo-url'
        }
      });

      setSyncState({
        isRunning: false,
        progress: null,
        results
      });

      // Recarrega dados após sincronização
      await loadCacheData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro durante sincronização';
      setError(errorMessage);
      
      // Log detalhado para debugging
      console.error('Erro na sincronização:', {
        error: err,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      setSyncState({
        isRunning: false,
        progress: null,
        results: null
      });
    }
  };

  // Remove arquivo específico
  const handleDeleteFile = async (file: CacheRecord) => {
    if (!file.id) return;
    
    try {
      await cacheInstance.deleteFile(file.id, file.category);
      await loadCacheData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar arquivo');
    }
  };

  // Baixa arquivo do cache
  const handleDownloadFile = async (file: CacheRecord) => {
    try {
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.title;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao baixar arquivo');
    }
  };

  // Limpa todo o cache
  const handleClearAll = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todo o cache? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setSyncState(prev => ({ ...prev, isRunning: true }));
    setError(null);
    
    try {
      await cacheInstance.clearAll();
      await loadCacheData();
      
      // Mostrar feedback de sucesso
      console.log('Cache limpo com sucesso');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar cache';
      setError(errorMessage);
      
      console.error('Erro ao limpar cache:', err);
    } finally {
      setSyncState(prev => ({ ...prev, isRunning: false }));
    }
  };

  // Formata tamanho em bytes
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ícone por categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'videos': return <Video className="w-4 h-4" />;
      case 'audios': return <Music className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'forms': return <File className="w-4 h-4" />;
      default: return <File className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <HardDrive className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Gerenciar Cache de Anexos</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Estatísticas */}
        {usage && (
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{usage.totalFiles}</div>
                <div className="text-sm text-gray-600">Total de Arquivos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{formatSize(usage.totalSize)}</div>
                <div className="text-sm text-gray-600">Tamanho Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">{usage.byCategory.videos.count}</div>
                <div className="text-sm text-gray-600">Vídeos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">{usage.byCategory.audios.count}</div>
                <div className="text-sm text-gray-600">Áudios</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{usage.byCategory.documents.count}</div>
                <div className="text-sm text-gray-600">Documentos</div>
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="p-6 border-b">
          <div className="flex flex-wrap items-center gap-4">
            {/* Botão Sincronizar */}
            <button
              onClick={handleSyncAttachments}
              disabled={syncState.isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${syncState.isRunning ? 'animate-spin' : ''}`} />
              {syncState.isRunning ? 'Sincronizando...' : 'Salvar Anexos'}
            </button>

            {/* Filtro por categoria */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as categorias</option>
              <option value="videos">Vídeos</option>
              <option value="audios">Áudios</option>
              <option value="documents">Documentos</option>
              <option value="forms">Formulários</option>
            </select>

            {/* Botão Limpar Cache */}
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Cache
            </button>

            {/* Botão Atualizar */}
            <button
              onClick={loadCacheData}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {/* Barra de progresso */}
          {syncState.isRunning && syncState.progress && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Processando: {syncState.progress.currentFile}</span>
                <span>{syncState.progress.current} / {syncState.progress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(syncState.progress.current / syncState.progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Resultados da sincronização */}
          {syncState.results && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-green-800">
                Sincronização concluída: {syncState.results.success} salvos, {syncState.results.skipped} ignorados, {syncState.results.errors} erros
                {syncState.results.totalSize > 0 && ` (${formatSize(syncState.results.totalSize)} baixados)`}
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}
        </div>

        {/* Lista de arquivos */}
        <div className="flex-1 overflow-auto">
          {files.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum arquivo em cache</p>
              <p className="text-sm">Use "Salvar Anexos" para começar</p>
            </div>
          ) : (
            <div className="divide-y">
              {files.map((file) => (
                <div key={`${file.category}-${file.id}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {getCategoryIcon(file.category)}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{file.title}</div>
                        <div className="text-sm text-gray-500">
                          {file.category} • {formatSize(file.size)} • {file.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Baixar arquivo"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Remover do cache"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CacheManager;