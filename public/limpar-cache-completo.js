/**
 * Script para limpeza completa de cache e dados antigos
 * Execute este script no console do navegador (F12)
 */

(function limpezaCompletaCache() {
  console.log('🧹 Iniciando limpeza completa de cache e dados antigos...');
  
  // 1. Limpar localStorage
  console.log('📦 Limpando localStorage...');
  const chavesParaRemover = [];
  for (let i = 0; i < localStorage.length; i++) {
    const chave = localStorage.key(i);
    if (chave && (
      chave.includes('dadosFamiliares') ||
      chave.includes('secaoFamilia') ||
      chave.includes('familia') ||
      chave.includes('layout') ||
      chave.includes('1.0') ||
      chave.includes('antigo')
    )) {
      chavesParaRemover.push(chave);
    }
  }
  
  chavesParaRemover.forEach(chave => {
    localStorage.removeItem(chave);
    console.log(`❌ Removido: ${chave}`);
  });
  
  // 2. Limpar sessionStorage
  console.log('🗂️ Limpando sessionStorage...');
  const chavesSessionParaRemover = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const chave = sessionStorage.key(i);
    if (chave && (
      chave.includes('dadosFamiliares') ||
      chave.includes('secaoFamilia') ||
      chave.includes('familia') ||
      chave.includes('layout')
    )) {
      chavesSessionParaRemover.push(chave);
    }
  }
  
  chavesSessionParaRemover.forEach(chave => {
    sessionStorage.removeItem(chave);
    console.log(`❌ Removido do session: ${chave}`);
  });
  
  // 3. Limpar IndexedDB relacionado
  console.log('🗄️ Limpando IndexedDB relacionado...');
  if ('indexedDB' in window) {
    // Tentar limpar bases de dados relacionadas
    const dbsParaLimpar = ['familia', 'layout', 'dadosFamiliares'];
    dbsParaLimpar.forEach(dbName => {
      try {
        indexedDB.deleteDatabase(dbName);
        console.log(`🗑️ IndexedDB removido: ${dbName}`);
      } catch (error) {
        console.log(`⚠️ Erro ao remover IndexedDB ${dbName}:`, error);
      }
    });
  }
  
  // 4. Limpar cache do Service Worker
  console.log('🔄 Limpando cache do Service Worker...');
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName.includes('familia') || 
            cacheName.includes('layout') ||
            cacheName.includes('v1') ||
            cacheName.includes('old')
          )
          .map(cacheName => {
            console.log(`🗑️ Removendo cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('✅ Cache do Service Worker limpo');
    }).catch(error => {
      console.log('⚠️ Erro ao limpar cache:', error);
    });
  }
  
  // 5. Forçar definição da nova versão
  console.log('🔧 Definindo nova versão...');
  localStorage.setItem('secaoFamiliaVersao', '2.0.0');
  
  // 6. Recarregar a página
  console.log('🔄 Recarregando página em 2 segundos...');
  setTimeout(() => {
    console.log('✅ Limpeza completa finalizada! Recarregando...');
    window.location.reload();
  }, 2000);
  
  console.log('🎉 Limpeza completa executada com sucesso!');
  console.log('📋 Resumo:');
  console.log(`   - ${chavesParaRemover.length} itens removidos do localStorage`);
  console.log(`   - ${chavesSessionParaRemover.length} itens removidos do sessionStorage`);
  console.log('   - IndexedDB e caches limpos');
  console.log('   - Nova versão definida: 2.0.0');
})();