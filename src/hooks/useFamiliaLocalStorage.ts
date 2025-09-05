import { useState, useEffect, useCallback } from 'react';
import { DadosFamiliares, criarDadosFamiliaresVazios } from '../types/familia';

interface UseFamiliaLocalStorageOptions {
  chave?: string;
  clienteId?: string;
  autoSalvar?: boolean;
  intervaloAutoSalvar?: number; // em milissegundos
}

interface UseFamiliaLocalStorageReturn {
  dadosFamilia: DadosFamiliares;
  salvarDados: (dados: DadosFamiliares) => void;
  carregarDados: () => DadosFamiliares | null;
  limparDados: () => void;
  temDadosSalvos: boolean;
  ultimaSalvamento: Date | null;
  salvandoAutomaticamente: boolean;
}

/**
 * Hook personalizado para gerenciar persistência de dados familiares no localStorage
 * 
 * @param options - Opções de configuração
 * @returns Objeto com dados e funções para gerenciar localStorage
 */
export const useFamiliaLocalStorage = ({
  chave = 'dadosFamiliares',
  clienteId,
  autoSalvar = true,
  intervaloAutoSalvar = 2000 // 2 segundos
}: UseFamiliaLocalStorageOptions = {}): UseFamiliaLocalStorageReturn => {
  
  // Gerar chave única baseada no clienteId se fornecido
  const chaveStorage = clienteId ? `${chave}_${clienteId}` : chave;
  const chaveMetadata = `${chaveStorage}_metadata`;
  
  const [dadosFamilia, setDadosFamilia] = useState<DadosFamiliares>(criarDadosFamiliaresVazios());
  const [temDadosSalvos, setTemDadosSalvos] = useState(false);
  const [ultimaSalvamento, setUltimaSalvamento] = useState<Date | null>(null);
  const [salvandoAutomaticamente, setSalvandoAutomaticamente] = useState(false);
  const [timeoutAutoSalvar, setTimeoutAutoSalvar] = useState<NodeJS.Timeout | null>(null);

  /**
   * Salva dados no localStorage
   */
  const salvarDados = useCallback((dados: DadosFamiliares) => {
    try {
      const dadosParaSalvar = {
        ...dados,
        versao: '2.0.0',
        timestamp: new Date().toISOString()
      };
      
      const metadata = {
        ultimaSalvamento: new Date().toISOString(),
        versao: '2.0.0',
        clienteId: clienteId || null
      };
      
      localStorage.setItem(chaveStorage, JSON.stringify(dadosParaSalvar));
      localStorage.setItem(chaveMetadata, JSON.stringify(metadata));
      
      setTemDadosSalvos(true);
      setUltimaSalvamento(new Date());
      
      console.log(`Dados familiares salvos com sucesso: ${chaveStorage}`);
    } catch (error) {
      console.error('Erro ao salvar dados familiares no localStorage:', error);
    }
  }, [chaveStorage, chaveMetadata, clienteId]);

  /**
   * Carrega dados do localStorage
   */
  const carregarDados = useCallback((): DadosFamiliares | null => {
    try {
      const dadosSalvos = localStorage.getItem(chaveStorage);
      const metadataSalva = localStorage.getItem(chaveMetadata);
      
      if (!dadosSalvos) {
        setTemDadosSalvos(false);
        return null;
      }
      
      const dados = JSON.parse(dadosSalvos) as DadosFamiliares & {
        versao?: string;
        timestamp?: string;
      };
      
      if (metadataSalva) {
        const metadata = JSON.parse(metadataSalva);
        setUltimaSalvamento(new Date(metadata.ultimaSalvamento));
      }
      
      // Remover campos de metadata dos dados
      const { versao, timestamp, ...dadosLimpos } = dados;
      
      setTemDadosSalvos(true);
      console.log(`Dados familiares carregados com sucesso: ${chaveStorage}`);
      
      return dadosLimpos as DadosFamiliares;
    } catch (error) {
      console.error('Erro ao carregar dados familiares do localStorage:', error);
      setTemDadosSalvos(false);
      return null;
    }
  }, [chaveStorage, chaveMetadata]);

  /**
   * Remove dados do localStorage
   */
  const limparDados = useCallback(() => {
    try {
      localStorage.removeItem(chaveStorage);
      localStorage.removeItem(chaveMetadata);
      
      setTemDadosSalvos(false);
      setUltimaSalvamento(null);
      setDadosFamilia(criarDadosFamiliaresVazios());
      
      console.log(`Dados familiares removidos: ${chaveStorage}`);
    } catch (error) {
      console.error('Erro ao limpar dados familiares do localStorage:', error);
    }
  }, [chaveStorage, chaveMetadata]);

  /**
   * Auto-salvar com debounce
   */
  const agendarAutoSalvar = useCallback((dados: DadosFamiliares) => {
    if (!autoSalvar) return;
    
    // Limpar timeout anterior
    if (timeoutAutoSalvar) {
      clearTimeout(timeoutAutoSalvar);
    }
    
    setSalvandoAutomaticamente(true);
    
    const novoTimeout = setTimeout(() => {
      salvarDados(dados);
      setSalvandoAutomaticamente(false);
    }, intervaloAutoSalvar);
    
    setTimeoutAutoSalvar(novoTimeout);
  }, [autoSalvar, intervaloAutoSalvar, timeoutAutoSalvar, salvarDados]);

  /**
   * Atualizar dados e agendar auto-salvamento
   */
  const atualizarDados = useCallback((novosDados: DadosFamiliares) => {
    setDadosFamilia(novosDados);
    agendarAutoSalvar(novosDados);
  }, [agendarAutoSalvar]);

  // Carregar dados iniciais
  useEffect(() => {
    const dadosCarregados = carregarDados();
    if (dadosCarregados) {
      setDadosFamilia(dadosCarregados);
    }
  }, [carregarDados]);

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutAutoSalvar) {
        clearTimeout(timeoutAutoSalvar);
      }
    };
  }, [timeoutAutoSalvar]);

  // Salvar dados antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (timeoutAutoSalvar) {
        clearTimeout(timeoutAutoSalvar);
        salvarDados(dadosFamilia);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [dadosFamilia, salvarDados, timeoutAutoSalvar]);

  return {
    dadosFamilia,
    salvarDados: atualizarDados,
    carregarDados,
    limparDados,
    temDadosSalvos,
    ultimaSalvamento,
    salvandoAutomaticamente
  };
};

export default useFamiliaLocalStorage;