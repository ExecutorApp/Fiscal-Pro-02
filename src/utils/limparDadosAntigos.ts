/**
 * Utilitário para limpeza completa de dados antigos do localStorage
 * relacionados ao sistema de família e layout antigo
 */

/**
 * Lista de chaves do localStorage que devem ser removidas
 * para garantir limpeza completa do layout antigo
 */
const CHAVES_DADOS_ANTIGOS = [
  // Dados familiares antigos
  'dadosFamiliares',
  'dadosFamiliares_metadata',
  'secaoFamiliaVersao',
  
  // Possíveis variações com clienteId
  'dadosFamiliares_',
  'dadosFamiliares_metadata_',
  
  // Dados de layout antigo (se existirem)
  'layoutFamilia',
  'familiaLayout',
  'familiaConfig',
  'configFamilia',
  
  // Cache de componentes antigos
  'SecaoFamilia_cache',
  'familia_cache',
  'carrosselFamilia_cache'
];

/**
 * Remove todas as chaves relacionadas a dados familiares antigos
 */
export const limparDadosFamiliaresAntigos = (): void => {
  try {
    console.log('Iniciando limpeza de dados familiares antigos...');
    
    // Obter todas as chaves do localStorage
    const todasAsChaves = Object.keys(localStorage);
    
    // Filtrar chaves que correspondem aos padrões antigos
    const chavesParaRemover = todasAsChaves.filter(chave => {
      return CHAVES_DADOS_ANTIGOS.some(padrão => {
        // Verificar correspondência exata ou prefixo
        return chave === padrão || 
               chave.startsWith(padrão) ||
               chave.includes('dadosFamiliares') && chave.includes('1.0');
      });
    });
    
    // Remover cada chave encontrada
    chavesParaRemover.forEach(chave => {
      localStorage.removeItem(chave);
      console.log(`Removida chave antiga: ${chave}`);
    });
    
    // Forçar definição da nova versão
    localStorage.setItem('secaoFamiliaVersao', '2.0.0');
    
    console.log(`Limpeza concluída. ${chavesParaRemover.length} chaves removidas.`);
    
  } catch (error) {
    console.error('Erro durante limpeza de dados antigos:', error);
  }
};

/**
 * Verifica se existem dados antigos no localStorage
 */
export const verificarDadosAntigos = (): boolean => {
  try {
    const todasAsChaves = Object.keys(localStorage);
    console.log('🔍 [verificarDadosAntigos] Verificando chaves:', todasAsChaves);
    console.log('🔍 [verificarDadosAntigos] Padrões procurados:', CHAVES_DADOS_ANTIGOS);
    
    const chavesEncontradas: string[] = [];
    
    const temDadosAntigos = todasAsChaves.some(chave => {
      const encontrou = CHAVES_DADOS_ANTIGOS.some(padrão => {
        const match = chave === padrão || 
                     chave.startsWith(padrão) ||
                     (chave.includes('dadosFamiliares') && chave.includes('1.0'));
        
        if (match) {
          chavesEncontradas.push(`${chave} (padrão: ${padrão})`);
        }
        
        return match;
      });
      
      return encontrou;
    });
    
    console.log('🔍 [verificarDadosAntigos] Chaves antigas encontradas:', chavesEncontradas);
    console.log('🔍 [verificarDadosAntigos] Resultado:', temDadosAntigos);
    
    return temDadosAntigos;
  } catch (error) {
    console.error('Erro ao verificar dados antigos:', error);
    return false;
  }
};

/**
 * Força migração de dados antigos para nova versão
 */
export const migrarDadosParaNovaVersao = (): void => {
  try {
    console.log('Iniciando migração de dados para versão 2.0.0...');
    
    // Primeiro, limpar todos os dados antigos
    limparDadosFamiliaresAntigos();
    
    // Garantir que a versão correta está definida
    localStorage.setItem('secaoFamiliaVersao', '2.0.0');
    
    // Limpar cache do navegador relacionado (se aplicável)
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('familia') || cacheName.includes('layout')) {
            caches.delete(cacheName);
            console.log(`Cache removido: ${cacheName}`);
          }
        });
      });
    }
    
    console.log('Migração concluída com sucesso.');
    
  } catch (error) {
    console.error('Erro durante migração:', error);
  }
};

/**
 * Executa limpeza completa de todos os dados persistidos
 * incluindo localStorage, sessionStorage e cache
 */
export const limpezaCompleta = (): void => {
  try {
    console.log('🧹 Executando limpeza completa e agressiva do sistema...');
    
    // 1. Limpar TODOS os dados familiares
    limparDadosFamiliaresAntigos();
    
    // 2. Limpeza agressiva do localStorage
    const todasChavesLocal = Object.keys(localStorage);
    todasChavesLocal.forEach(chave => {
      if (chave.includes('familia') || 
          chave.includes('layout') || 
          chave.includes('secao') ||
          chave.includes('1.0') ||
          chave.includes('antigo') ||
          chave.includes('old') ||
          chave.includes('legacy')) {
        localStorage.removeItem(chave);
        console.log(`🗑️ LocalStorage removido: ${chave}`);
      }
    });
    
    // 3. Limpeza agressiva do sessionStorage
    const todasChavesSession = Object.keys(sessionStorage);
    todasChavesSession.forEach(chave => {
      if (chave.includes('familia') || 
          chave.includes('layout') ||
          chave.includes('secao') ||
          chave.includes('dados')) {
        sessionStorage.removeItem(chave);
        console.log(`🗑️ SessionStorage removido: ${chave}`);
      }
    });
    
    // 4. Limpar IndexedDB relacionado
    if ('indexedDB' in window) {
      const dbsParaLimpar = ['familia', 'layout', 'dadosFamiliares', 'secaoFamilia'];
      dbsParaLimpar.forEach(dbName => {
        try {
          indexedDB.deleteDatabase(dbName);
          console.log(`🗑️ IndexedDB removido: ${dbName}`);
        } catch (error) {
          console.warn(`⚠️ Erro ao remover IndexedDB ${dbName}:`, error);
        }
      });
    }
    
    // 5. Limpar cache do service worker de forma mais agressiva
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        const cachesParaRemover = cacheNames.filter(cacheName => 
          cacheName.includes('familia') || 
          cacheName.includes('layout') ||
          cacheName.includes('v1') ||
          cacheName.includes('old') ||
          cacheName.includes('antigo')
        );
        
        return Promise.all(
          cachesParaRemover.map(cacheName => {
            console.log(`🗑️ Cache removido: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).catch(error => {
        console.warn('⚠️ Erro ao limpar caches:', error);
      });
    }
    
    // 6. Forçar nova versão e timestamp
    localStorage.setItem('secaoFamiliaVersao', '2.0.0');
    localStorage.setItem('limpezaCompleta_timestamp', new Date().toISOString());
    
    console.log('✅ Limpeza completa e agressiva finalizada com sucesso!');
    console.log('🔄 Recomenda-se recarregar a página para garantir que as mudanças tenham efeito.');
    
  } catch (error) {
    console.error('❌ Erro durante limpeza completa:', error);
  }
};

export default {
  limparDadosFamiliaresAntigos,
  verificarDadosAntigos,
  migrarDadosParaNovaVersao,
  limpezaCompleta
};