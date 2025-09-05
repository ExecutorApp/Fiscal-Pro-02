import { useState, useEffect } from 'react';
import { MenuItem } from './1.GerenciarDocumentos';

export const useDocumentosData = (isOpen: boolean, activeTab: 'fisica' | 'juridica') => {
  // Constantes para localStorage
  const STORAGE_KEY_JURIDICA = 'gerenciarDocumentos_juridica_data';
  const STORAGE_KEY_FISICA = 'gerenciarDocumentos_fisica_data';
  const STORAGE_KEY_ACTIVE_TAB = 'gerenciarDocumentos_activeTab';
  const STORAGE_KEY_AUTO_NUMBER = 'gerenciarDocumentos_autoNumber';

  // Estados principais
  const [fisicaData, setFisicaData] = useState<MenuItem[]>([]);
  const [juridicaData, setJuridicaData] = useState<MenuItem[]>([]);
  
  // Estado para controlar a preferência de numeração automática
  const [numeracaoAutomatica, setNumeracaoAutomatica] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO_NUMBER);
    return saved !== null ? JSON.parse(saved) : true; // true por padrão
  });

  // Estados para controlar dados originais (para detectar mudanças)
  const [originalFisicaData, setOriginalFisicaData] = useState<MenuItem[]>([]);
  const [originalJuridicaData, setOriginalJuridicaData] = useState<MenuItem[]>([]);

  // Função para salvar dados no localStorage
  const saveToLocalStorage = (key: string, data: any) => {
    try {
      const dataToSave = {
        data: data,
        timestamp: Date.now(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      console.log(`✅ Dados salvos no localStorage: ${key}`);
  
      // Verificar se há imagens com metadados
      const imagensComMetadados = data.flatMap((item: MenuItem) => {
        const getAllItems = (menuItem: MenuItem): MenuItem[] => {
          const items = [menuItem];
          if (menuItem.children) {
            menuItem.children.forEach(child => {
              items.push(...getAllItems(child));
            });
          }
          return items;
        };
        return getAllItems(item).filter(subItem => subItem.storageKey);
      });
  
    } catch (error) {
      console.error(`❌ Erro ao salvar no localStorage (${key}):`, error);
    }
  };

  // Função para carregar dados do localStorage
  const loadFromLocalStorage = (key: string): MenuItem[] => {
    try {
      const savedData = localStorage.getItem(key);
      if (!savedData) return [];
      
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.data && Array.isArray(parsed.data)) {
        console.log(`✅ Dados carregados do localStorage: ${key}`);
    
        // Verificar se há imagens com metadados nos dados carregados
        const imagensComMetadados = parsed.data.flatMap((item: MenuItem) => {
          const getAllItems = (menuItem: MenuItem): MenuItem[] => {
            const items = [menuItem];
            if (menuItem.children) {
              menuItem.children.forEach(child => {
                items.push(...getAllItems(child));
              });
            }
            return items;
          };
          return getAllItems(item).filter(subItem => subItem.storageKey);
        });
    
        return parsed.data;
      }
      return [];
    } catch (error) {
      console.error(`❌ Erro ao carregar do localStorage (${key}):`, error);
      return [];
    }
  };

  // Função para limpar dados salvos (opcional - para debug ou reset)
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_JURIDICA);
      localStorage.removeItem(STORAGE_KEY_FISICA);
      localStorage.removeItem(STORAGE_KEY_ACTIVE_TAB);
      
      // Resetar estados
      setJuridicaData([]);
      setFisicaData([]);

      console.log('🗑️ Dados do localStorage limpos');
    } catch (error) {
      console.error('❌ Erro ao limpar localStorage:', error);
    }
  };

  // Função para exportar dados (backup)
  const exportData = () => {
    try {
      const exportData = {
        juridicaData,
        fisicaData,
        activeTab,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `gerenciar-documentos-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      console.log('💾 Backup exportado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    if (isOpen) {
      loadFromLocalStorage();
    }
  }, [isOpen]);

  // Definir dados originais após carregamento
  useEffect(() => {
    if (fisicaData.length > 0 && originalFisicaData.length === 0) {
      setOriginalFisicaData(JSON.parse(JSON.stringify(fisicaData)));
    }
    if (juridicaData.length > 0 && originalJuridicaData.length === 0) {
      setOriginalJuridicaData(JSON.parse(JSON.stringify(juridicaData)));
    }
  }, [fisicaData, juridicaData, originalFisicaData.length, originalJuridicaData.length]);

  // Salvar automaticamente quando dados mudarem
  useEffect(() => {
    const fisicaChanged = JSON.stringify(fisicaData) !== JSON.stringify(originalFisicaData);
    const juridicaChanged = JSON.stringify(juridicaData) !== JSON.stringify(originalJuridicaData);
    
    // Salvar apenas se houver mudanças reais e não estivermos na inicialização
    if (fisicaChanged && originalFisicaData.length > 0) {
      saveToLocalStorage(STORAGE_KEY_FISICA, fisicaData);
      setOriginalFisicaData(JSON.parse(JSON.stringify(fisicaData)));
    }
    
    if (juridicaChanged && originalJuridicaData.length > 0) {
      saveToLocalStorage(STORAGE_KEY_JURIDICA, juridicaData);
      setOriginalJuridicaData(JSON.parse(JSON.stringify(juridicaData)));
    }
  }, [fisicaData, juridicaData, originalFisicaData, originalJuridicaData]);

  return {
    fisicaData,
    juridicaData,
    setFisicaData,
    setJuridicaData,
    numeracaoAutomatica,
    setNumeracaoAutomatica,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    exportData,
    STORAGE_KEY_JURIDICA,
    STORAGE_KEY_FISICA,
    STORAGE_KEY_ACTIVE_TAB,
    STORAGE_KEY_AUTO_NUMBER
  };
};