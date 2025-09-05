import React, { useState } from 'react';
import VisualizarDocumento from './VisualizarDocumentos';

const TesteTexto: React.FC = () => {
  const [testeAtivo, setTesteAtivo] = useState<'url' | 'string' | 'file'>('url');
  
  const textoTeste = `Este é um teste de visualização de texto.

Este conteúdo está sendo passado diretamente como string para o componente VisualizarDocumento.

Linhas de teste:
- Item 1: Teste de formatação
- Item 2: Quebras de linha
- Item 3: Caracteres especiais: áéíóú ção

Data: ${new Date().toLocaleString()}`;
  
  const criarArquivoTeste = () => {
    const blob = new Blob([textoTeste], { type: 'text/plain' });
    return new File([blob], 'teste.txt', { type: 'text/plain' });
  };
  
  return (
    <div className="w-full h-screen p-4">
      <h1 className="text-xl font-bold mb-4">Teste de Visualização de Texto</h1>
      
      {/* Botões de teste */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTesteAtivo('url')}
          className={`px-4 py-2 rounded ${testeAtivo === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Teste URL
        </button>
        <button
          onClick={() => setTesteAtivo('string')}
          className={`px-4 py-2 rounded ${testeAtivo === 'string' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Teste String
        </button>
        <button
          onClick={() => setTesteAtivo('file')}
          className={`px-4 py-2 rounded ${testeAtivo === 'file' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Teste File
        </button>
      </div>
      
      <div className="w-full h-96 border border-gray-300 rounded">
        {testeAtivo === 'url' && (
          <VisualizarDocumento
            src="/test-text-file.txt"
            fileName="test-text-file.txt"
            width="100%"
            height="100%"
            allowDownload={true}
            onLoad={() => console.log('✅ URL: Arquivo de texto carregado com sucesso')}
            onError={(error) => console.error('❌ URL: Erro ao carregar arquivo de texto:', error)}
          />
        )}
        
        {testeAtivo === 'string' && (
          <VisualizarDocumento
            src={textoTeste}
            fileName="teste-string.txt"
            width="100%"
            height="100%"
            allowDownload={true}
            onLoad={() => console.log('✅ STRING: Texto carregado com sucesso')}
            onError={(error) => console.error('❌ STRING: Erro ao carregar texto:', error)}
          />
        )}
        
        {testeAtivo === 'file' && (
          <VisualizarDocumento
            src={criarArquivoTeste()}
            fileName="teste-file.txt"
            width="100%"
            height="100%"
            allowDownload={true}
            onLoad={() => console.log('✅ FILE: Arquivo de texto carregado com sucesso')}
            onError={(error) => console.error('❌ FILE: Erro ao carregar arquivo de texto:', error)}
          />
        )}
      </div>
    </div>
  );
};

export default TesteTexto;