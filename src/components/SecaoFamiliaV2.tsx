import React, { useEffect, useReducer, useCallback, useState } from 'react';
import { 
  DadosFamiliares, 
  Filho, 
  Neto, 
  Conjuge, 
  PessoaFamiliar,
  criarDadosFamiliaresVazios 
} from '../types/familia';
import { familiaReducer } from '../reducers/familiaReducer';
import { useFamiliaEstados } from '../hooks/useFamiliaEstados';
import CarrosselFamilia from './CarrosselFamilia';
import FormularioFamiliar from './FormularioFamiliar';

interface SecaoFamiliaV2Props {
  dadosIniciais?: DadosFamiliares;
  onChange?: (dados: DadosFamiliares) => void;
  className?: string;
  clienteId?: string;
}

/**
 * Componente SecaoFamilia V2 - Implementa todas as regras de cadeia de dependências
 * 
 * Regras implementadas:
 * 1. Cadeia em coluna: cada coluna depende da esquerda
 * 2. Cônjuge: N cônjuges. Ao trocar de cônjuge, as colunas 2/3/4 resetam; ao voltar, reaparecem os dados salvos
 * 3. Para cada cônjuge: N filhos. Cada filho guarda seu próprio estado
 * 4. Ao trocar de filho: colunas "cônjuge do filho" e "filhos do filho" resetam; ao voltar, restauram o estado salvo
 * 5. Persistência: cada cônjuge e cada filho têm sua árvore salva localmente
 * 6. Remoções respeitam a cadeia
 * 7. Estados vazios mostram placeholders
 * 8. Navegação sempre reflete a seleção atual
 * 9. Validação básica sem quebrar navegação
 */
export const SecaoFamiliaV2: React.FC<SecaoFamiliaV2Props> = ({
  dadosIniciais = criarDadosFamiliaresVazios(),
  onChange,
  className = '',
  clienteId
}) => {
  // Usar o novo hook para gerenciar estados
  const {
    dadosFamilia,
    setDadosFamilia,
    filhoSelecionado,
    setFilhoSelecionado,
    conjugeFilhoSelecionado,
    setConjugeFilhoSelecionado,
    netoSelecionado,
    setNetoSelecionado,
    salvarEstadoConjugeAtivo,
    carregarEstadoConjugeAtivo,
    salvarEstadoExConjuge,
    carregarEstadoExConjuge,
    salvarEstadoFilho,
    carregarEstadoFilho,
    removerEstadoFilho,
    salvarEstadoGeral,
    carregarEstadoGeral,
    salvarIndicesConjugeAtivo,
    carregarIndicesConjugeAtivo,
    salvarIndicesExConjuge,
    carregarIndicesExConjuge,
    salvarNetosConjugeAtivoFilho,
    carregarNetosConjugeAtivoFilho,
    salvarNetosConjugeFilho,
    carregarNetosConjugeFilho,
    removerNetosConjugeAtivoFilho,
    removerNetosConjugeFilho
  } = useFamiliaEstados(clienteId);

  // Estado para controlar as abas da primeira coluna
  const [abaAtiva, setAbaAtiva] = useState<'conjuge' | 'ex' | null>(null);
  const [exConjugeSelecionado, setExConjugeSelecionado] = useState(0);
  
  // Estado para controlar as abas da terceira coluna (Cônjuges do Filho)
  const [abaFilhoAtiva, setAbaFilhoAtiva] = useState<'conjuge' | 'ex' | null>(null);
  const [exConjugeFilhoSelecionado, setExConjugeFilhoSelecionado] = useState(0);
  
  // Flag para controlar se a seleção da aba foi manual (para evitar sobrescrever)
  const [selecaoManualAbaFilho, setSelecaoManualAbaFilho] = useState(false);
  
  // Flag para controlar quando as abas devem permanecer deselecionadas após reset
  const [manterAbasDeselecionadas, setManterAbasDeselecionadas] = useState(false);
  
  // Função auxiliar para aplicar lógica de seleção automática de aba C3
  const aplicarSelecaoAutomaticaAba = useCallback((indiceFilho: number) => {
    console.log('🔥 [DEBUG APLICAR SELEÇÃO] Função chamada para filho índice:', indiceFilho);
    console.log('🔥 [DEBUG] Stack trace:', new Error().stack);
    
    const filho = dadosFamilia.filhos?.[indiceFilho];
    console.log('🔥 [DEBUG] Filho encontrado:', filho);
    
    if (!filho) {
      console.log('🔥 [DEBUG] Filho não encontrado - setAbaFilhoAtiva(null)');
      setAbaFilhoAtiva(null);
      return;
    }

    const temConjuge = !!filho.conjugeAtivo;
    const temExConjuges = (filho.exConjuges?.length || 0) > 0;

    console.log('🔥 [DEBUG] Análise do filho:', {
      conjugeAtivo: filho.conjugeAtivo,
      exConjuges: filho.exConjuges,
      temConjuge,
      temExConjuges
    });

    // Regras definitivas de seleção de aba C3:
    // 1. Se Cônjuge = "00" e Ex = "00" ⇒ mostrar Placeholder
    // 2. Se só Cônjuge > "00" ⇒ selecionar aba Cônjuge
    // 3. Se só Ex > "00" ⇒ selecionar aba Ex
    // 4. Se ambos > "00" ⇒ priorizar Cônjuge
    if (!temConjuge && !temExConjuges) {
      // Caso 1: Ambos são "00" - Placeholder
      console.log('🔥 [DEBUG] Caso 1: Nenhum cônjuge/ex-cônjuge - setAbaFilhoAtiva(null)');
      setAbaFilhoAtiva(null);
    } else if (temConjuge && !temExConjuges) {
      // Caso 2: Apenas cônjuge > "00" - Selecionar aba Cônjuge
      console.log('🔥 [DEBUG] Caso 2: Só cônjuge - setAbaFilhoAtiva(conjuge)');
      setAbaFilhoAtiva('conjuge');
    } else if (!temConjuge && temExConjuges) {
      // Caso 3: Apenas ex > "00" - Selecionar aba Ex
      console.log('🔥 [DEBUG] Caso 3: Só ex-cônjuge - setAbaFilhoAtiva(ex)');
      setAbaFilhoAtiva('ex');
    } else if (temConjuge && temExConjuges) {
      // Caso 4: Ambos > "00" - Priorizar Cônjuge
      console.log('🔥 [DEBUG] Caso 4: Ambos existem - setAbaFilhoAtiva(conjuge)');
      setAbaFilhoAtiva('conjuge');
    }
  }, [dadosFamilia.filhos]);

  // Handler para trocar aba com reset e restauração
  const handleTrocarAba = useCallback((novaAba: 'conjuge' | 'ex') => {
    if (abaAtiva === novaAba) return;
    
    console.log('🔄 [DEBUG TROCA ABA] Estado atual da aba filho:', abaFilhoAtiva);
    console.log('🔄 [DEBUG TROCA ABA] Índices atuais:', { filhoSelecionado, conjugeFilhoSelecionado, netoSelecionado });
    
    // Salvar estado atual dos filhos e índices antes da troca
    const indicesAtuais = { filhoSelecionado, conjugeFilhoSelecionado, netoSelecionado, abaFilhoAtiva };
    console.log('🔄 [DEBUG SALVAMENTO] Salvando índices:', indicesAtuais);
    
    // Salvar netos específicos do contexto atual antes de trocar
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual) {
      const netosAtuais = filhoAtual.filhos || [];
      if (netosAtuais.length > 0) {
        if (abaAtiva === 'conjuge' && filhoAtual.conjugeAtivo) {
          // Salvar netos do cônjuge ativo
          salvarNetosConjugeAtivoFilho(filhoSelecionado, netosAtuais);
        } else if (abaAtiva === 'ex' && filhoAtual.exConjuges?.[exConjugeFilhoSelecionado]) {
          // Salvar netos do ex-cônjuge atual (usar índice da coluna 1)
          salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtuais);
        }
      }
    }
    
    if (abaAtiva === 'conjuge') {
      salvarEstadoConjugeAtivo(dadosFamilia.filhos);
      salvarIndicesConjugeAtivo(indicesAtuais);
    } else if (abaAtiva === 'ex') {
      salvarEstadoExConjuge(exConjugeSelecionado, dadosFamilia.filhos);
      salvarIndicesExConjuge(exConjugeSelecionado, indicesAtuais);
    }
    
    // Reset das colunas 2, 3 e 4 (limpar à direita)
    setFilhoSelecionado(0);
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
    setAbaFilhoAtiva(null);
    setExConjugeFilhoSelecionado(0);
    
    // Resetar flag de seleção manual para permitir seleção automática no novo contexto
    setSelecaoManualAbaFilho(false);
    
    // Trocar aba
    setAbaAtiva(novaAba);
    
    // Reset das colunas dependentes
    dispatch({ tipo: 'RESETAR_FILHOS' });
    
    // Restaurar estado salvo para o novo contexto
    if (novaAba === 'conjuge') {
      const estadoSalvo = carregarEstadoConjugeAtivo();
      const indicesSalvos = carregarIndicesConjugeAtivo();
      
      if (estadoSalvo && estadoSalvo.length > 0) {
        estadoSalvo.forEach((filho, indice) => {
          dispatch({ tipo: 'ADICIONAR_FILHO' });
          dispatch({ tipo: 'ATUALIZAR_FILHO', indice, dados: filho });
        });
        
        // Carregar netos específicos do cônjuge ativo após restaurar filhos
        if (indicesSalvos) {
          const filhoRestaurado = estadoSalvo[indicesSalvos.filhoSelecionado];
          if (filhoRestaurado?.conjugeAtivo) {
            const netosSalvos = carregarNetosConjugeAtivoFilho(indicesSalvos.filhoSelecionado);
            if (netosSalvos && netosSalvos.length > 0) {
              dispatch({
                tipo: 'RESTAURAR_ESTADO_FILHO',
                indiceFilho: indicesSalvos.filhoSelecionado,
                conjuges: filhoRestaurado.exConjuges,
                netos: netosSalvos
              });
            }
          }
        }
      }
      
      // Restaurar índices salvos
      if (indicesSalvos) {
        console.log('🔄 [DEBUG TROCA ABA EX] Restaurando índices salvos:', indicesSalvos);
        setFilhoSelecionado(indicesSalvos.filhoSelecionado);
        setConjugeFilhoSelecionado(indicesSalvos.conjugeFilhoSelecionado);
        setNetoSelecionado(indicesSalvos.netoSelecionado);
        
        // Só aplicar seleção automática se há dados para selecionar
        const filhoParaValidar = dadosFamilia.filhos?.[indicesSalvos.filhoSelecionado];
        const temConjugeValidar = !!filhoParaValidar?.conjugeAtivo;
        const temExConjugesValidar = (filhoParaValidar?.exConjuges?.length || 0) > 0;
        
        if (temConjugeValidar || temExConjugesValidar) {
          console.log('🔄 [DEBUG TROCA ABA] Aplicando seleção automática após restaurar índices');
          setTimeout(() => aplicarSelecaoAutomaticaAba(indicesSalvos.filhoSelecionado), 100);
        } else {
          console.log('🔄 [DEBUG TROCA ABA] Nenhum dado para selecionar - mantendo aba deselecionada');
        }
      } else {
        console.log('🔄 [DEBUG TROCA ABA EX] Nenhum índice salvo - mantendo abas deselecionadas');
        // Se não há índices salvos, manter abas deselecionadas para novos cadastros
      }
    } else if (novaAba === 'ex') {
      const estadoSalvo = carregarEstadoExConjuge(exConjugeSelecionado);
      const indicesSalvos = carregarIndicesExConjuge(exConjugeSelecionado);
      
      if (estadoSalvo && estadoSalvo.length > 0) {
        estadoSalvo.forEach((filho, indice) => {
          dispatch({ tipo: 'ADICIONAR_FILHO' });
          dispatch({ tipo: 'ATUALIZAR_FILHO', indice, dados: filho });
        });
        
        // Carregar netos específicos do ex-cônjuge após restaurar filhos
        if (indicesSalvos) {
          const filhoRestaurado = estadoSalvo[indicesSalvos.filhoSelecionado];
          if (filhoRestaurado?.exConjuges?.[indicesSalvos.conjugeFilhoSelecionado]) {
            const netosSalvos = carregarNetosConjugeFilho(indicesSalvos.filhoSelecionado, indicesSalvos.conjugeFilhoSelecionado);
            if (netosSalvos && netosSalvos.length > 0) {
              dispatch({
                tipo: 'RESTAURAR_ESTADO_FILHO',
                indiceFilho: indicesSalvos.filhoSelecionado,
                conjuges: filhoRestaurado.exConjuges,
                netos: netosSalvos
              });
            }
          }
        }
      }
      
      // Restaurar índices salvos
      if (indicesSalvos) {
        console.log('🔄 [DEBUG TROCA ABA EX] Restaurando índices salvos:', indicesSalvos);
        setFilhoSelecionado(indicesSalvos.filhoSelecionado);
        setConjugeFilhoSelecionado(indicesSalvos.conjugeFilhoSelecionado);
        setNetoSelecionado(indicesSalvos.netoSelecionado);
        
        // Só aplicar seleção automática se há dados para selecionar
        const filhoParaValidarEx = dadosFamilia.filhos?.[indicesSalvos.filhoSelecionado];
        const temConjugeValidarEx = !!filhoParaValidarEx?.conjugeAtivo;
        const temExConjugesValidarEx = (filhoParaValidarEx?.exConjuges?.length || 0) > 0;
        
        if (temConjugeValidarEx || temExConjugesValidarEx) {
          console.log('🔄 [DEBUG TROCA ABA EX] Aplicando seleção automática após restaurar índices');
          setTimeout(() => aplicarSelecaoAutomaticaAba(indicesSalvos.filhoSelecionado), 100);
        } else {
          console.log('🔄 [DEBUG TROCA ABA EX] Nenhum dado para selecionar - mantendo aba deselecionada');
        }
      } else {
        console.log('🔄 [DEBUG TROCA ABA EX] Nenhum índice salvo - mantendo abas deselecionadas');
        // Se não há índices salvos, manter abas deselecionadas para novos cadastros
      }
    }
  }, [abaAtiva, dadosFamilia.filhos, exConjugeSelecionado, filhoSelecionado, exConjugeFilhoSelecionado, salvarEstadoConjugeAtivo, salvarEstadoExConjuge, carregarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarIndicesConjugeAtivo, carregarIndicesConjugeAtivo, salvarIndicesExConjuge, carregarIndicesExConjuge, salvarNetosConjugeAtivoFilho, carregarNetosConjugeAtivoFilho, salvarNetosConjugeFilho, carregarNetosConjugeFilho, aplicarSelecaoAutomaticaAba]);

  // Handler para trocar ex-cônjuge com reset e restauração
  const handleTrocarExConjuge = useCallback((novoIndice: number) => {
    if (exConjugeSelecionado === novoIndice) return;
    
    // Salvar netos da Coluna 4 antes de trocar ex-cônjuge
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual && abaFilhoAtiva === 'ex') {
      const netosAtuais = filhoAtual.filhos || [];
      if (netosAtuais.length > 0) {
        console.log('💾 [DEBUG TROCA EX-CONJUGE] Salvando netos do ex-cônjuge atual:', exConjugeSelecionado, netosAtuais);
        salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtuais);
      }
    }
    
    // Salvar estado atual dos filhos e índices do ex-cônjuge atual
    const indicesAtuais = { filhoSelecionado, conjugeFilhoSelecionado, netoSelecionado, abaFilhoAtiva };
    console.log('💾 [DEBUG TROCA EX-CONJUGE] Salvando estado atual:', indicesAtuais);
    salvarEstadoExConjuge(exConjugeSelecionado, dadosFamilia.filhos);
    salvarIndicesExConjuge(exConjugeSelecionado, indicesAtuais);
    
    // Reset das colunas 2, 3 e 4
    setFilhoSelecionado(0);
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
    setAbaFilhoAtiva(null);
    
    // Trocar ex-cônjuge
    setExConjugeSelecionado(novoIndice);
    
    // Reset das colunas dependentes
    dispatch({ tipo: 'RESETAR_FILHOS' });
    
    // Restaurar estado salvo para o novo ex-cônjuge
    const estadoSalvo = carregarEstadoExConjuge(novoIndice);
    const indicesSalvos = carregarIndicesExConjuge(novoIndice);
    
    if (estadoSalvo) {
      estadoSalvo.forEach((filho, indice) => {
        dispatch({ tipo: 'ADICIONAR_FILHO' });
        dispatch({ tipo: 'ATUALIZAR_FILHO', indice, dados: filho });
      });
    }
    
    // Restaurar índices salvos
    if (indicesSalvos) {
      console.log('🔄 [DEBUG TROCA EX-CONJUGE] Restaurando índices salvos:', indicesSalvos);
      setFilhoSelecionado(indicesSalvos.filhoSelecionado);
      setConjugeFilhoSelecionado(indicesSalvos.conjugeFilhoSelecionado);
      setNetoSelecionado(indicesSalvos.netoSelecionado);
      
      // Restaurar estado da aba se existir
      if (indicesSalvos.abaFilhoAtiva) {
        console.log('🔄 [DEBUG TROCA EX-CONJUGE] Restaurando aba filho:', indicesSalvos.abaFilhoAtiva);
        setAbaFilhoAtiva(indicesSalvos.abaFilhoAtiva);
        
        // Restaurar netos específicos do ex-cônjuge após restaurar a aba
        if (indicesSalvos.abaFilhoAtiva === 'ex' && estadoSalvo?.[indicesSalvos.filhoSelecionado]) {
          setTimeout(() => {
            const netosSalvos = carregarNetosConjugeFilho(indicesSalvos.filhoSelecionado, novoIndice);
            if (netosSalvos && netosSalvos.length > 0) {
              console.log('🔄 [DEBUG TROCA EX-CONJUGE] Restaurando netos específicos:', netosSalvos);
              dispatch({
                tipo: 'RESTAURAR_ESTADO_FILHO',
                indiceFilho: indicesSalvos.filhoSelecionado,
                conjuges: estadoSalvo[indicesSalvos.filhoSelecionado].exConjuges || [],
                netos: netosSalvos
              });
            }
          }, 150);
        }
      } else {
        console.log('🔄 [DEBUG TROCA EX-CONJUGE] Estado da aba não encontrado - verificando dados antes de aplicar seleção automática');
        // Só aplicar seleção automática se há dados para selecionar
        const filhoParaValidarTroca = dadosFamilia.filhos?.[indicesSalvos.filhoSelecionado];
        const temConjugeValidarTroca = !!filhoParaValidarTroca?.conjugeAtivo;
        const temExConjugesValidarTroca = (filhoParaValidarTroca?.exConjuges?.length || 0) > 0;
        
        if (temConjugeValidarTroca || temExConjugesValidarTroca) {
          console.log('🔄 [DEBUG TROCA EX-CONJUGE] Aplicando seleção automática');
          setTimeout(() => aplicarSelecaoAutomaticaAba(indicesSalvos.filhoSelecionado), 100);
        } else {
          console.log('🔄 [DEBUG TROCA EX-CONJUGE] Nenhum dado para selecionar - mantendo aba deselecionada');
        }
      }
    } else {
      console.log('🔄 [DEBUG TROCA EX-CONJUGE] Nenhum índice salvo - mantendo abas deselecionadas');
      // Se não há índices salvos, manter abas deselecionadas para novos cadastros
    }
  }, [exConjugeSelecionado, dadosFamilia.filhos, filhoSelecionado, conjugeFilhoSelecionado, netoSelecionado, abaFilhoAtiva, exConjugeFilhoSelecionado, salvarEstadoExConjuge, carregarEstadoExConjuge, salvarIndicesExConjuge, carregarIndicesExConjuge, salvarNetosConjugeFilho, carregarNetosConjugeFilho, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado, aplicarSelecaoAutomaticaAba]);



  // useEffect único para seleção automática de abas C3 baseada nas regras definitivas
  useEffect(() => {
    console.log('🔥 [DEBUG USEEFFECT] useEffect de seleção automática executado');
    console.log('🔥 [DEBUG] Dependências:', {
      filhoSelecionado,
      selecaoManualAbaFilho,
      manterAbasDeselecionadas,
      conjugeAtivo: dadosFamilia.filhos?.[filhoSelecionado]?.conjugeAtivo,
      exConjugesLength: dadosFamilia.filhos?.[filhoSelecionado]?.exConjuges?.length
    });
    
    // Não aplicar seleção automática se foi uma seleção manual
    if (selecaoManualAbaFilho) {
      console.log('🔥 [DEBUG] Seleção manual detectada - não aplicando seleção automática');
      return;
    }
    
    // Não aplicar seleção automática se as abas devem permanecer deselecionadas
    if (manterAbasDeselecionadas) {
      console.log('🔥 [DEBUG] Flag manterAbasDeselecionadas ativa - mantendo abas deselecionadas');
      return;
    }
    
    // Só aplicar seleção automática se o filho atual tem dados
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (!filhoAtual) {
      console.log('🔥 [DEBUG] Filho não encontrado - não aplicando seleção automática');
      return;
    }
    
    const temConjuge = !!filhoAtual.conjugeAtivo;
    const temExConjuges = (filhoAtual.exConjuges?.length || 0) > 0;
    
    // Só aplicar seleção automática se há dados para selecionar
    if (temConjuge || temExConjuges) {
      console.log('🔥 [DEBUG] Aplicando seleção automática com delay de 100ms');
      const timer = setTimeout(() => {
        aplicarSelecaoAutomaticaAba(filhoSelecionado);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      console.log('🔥 [DEBUG] Nenhum dado para selecionar - mantendo aba deselecionada');
    }
  }, [
    dadosFamilia.filhos?.[filhoSelecionado]?.conjugeAtivo, 
    dadosFamilia.filhos?.[filhoSelecionado]?.exConjuges?.length, 
    filhoSelecionado, 
    selecaoManualAbaFilho,
    manterAbasDeselecionadas,
    aplicarSelecaoAutomaticaAba
  ]);

  // Handler para trocar aba do filho com reset da coluna 4
  const handleTrocarAbaFilho = useCallback((novaAba: 'conjuge' | 'ex') => {
    if (abaFilhoAtiva === novaAba) return;
    
    console.log('🔄 [DEBUG TROCA ABA FILHO] Trocando aba da coluna 3 para:', novaAba);
    
    // Marcar como seleção manual para evitar sobrescrita pelos useEffect
    setSelecaoManualAbaFilho(true);
    
    // Salvar estado atual da aba antes de trocar
    const indicesAtuais = {
      filhoSelecionado,
      conjugeFilhoSelecionado: exConjugeFilhoSelecionado,
      netoSelecionado,
      abaFilhoAtiva
    };
    console.log('🔄 [DEBUG TROCA ABA FILHO] Salvando estado atual:', indicesAtuais);
    salvarIndicesExConjuge(exConjugeSelecionado, indicesAtuais);
    
    // Salvar netos do contexto atual antes de trocar
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual) {
      const netosAtuais = filhoAtual.filhos || [];
      if (netosAtuais.length > 0) {
        if (abaFilhoAtiva === 'conjuge' && filhoAtual.conjugeAtivo) {
          // Salvar netos do cônjuge ativo
          salvarNetosConjugeAtivoFilho(filhoSelecionado, netosAtuais);
        } else if (abaFilhoAtiva === 'ex' && filhoAtual.exConjuges?.[exConjugeFilhoSelecionado]) {
          // Salvar netos do ex-cônjuge atual (usar índice da coluna 1)
          salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtuais);
        }
      }
    }
    
    // Reset da coluna 4 (netos)
    setNetoSelecionado(0);
    
    // Trocar aba
    setAbaFilhoAtiva(novaAba);
    setExConjugeFilhoSelecionado(0);
    
    // Carregar netos específicos do novo contexto selecionado
    if (filhoAtual) {
      let netosParaMostrar: Neto[] = [];
      
      if (novaAba === 'conjuge' && filhoAtual.conjugeAtivo) {
        // Carregar netos do cônjuge ativo
        const netosSalvos = carregarNetosConjugeAtivoFilho(filhoSelecionado);
        netosParaMostrar = netosSalvos || [];
      } else if (novaAba === 'ex' && filhoAtual.exConjuges?.length > 0) {
        // Carregar netos do primeiro ex-cônjuge (índice 0)
        const netosSalvos = carregarNetosConjugeFilho(filhoSelecionado, 0);
        netosParaMostrar = netosSalvos || [];
      }
      
      dispatch({
        tipo: 'RESTAURAR_ESTADO_FILHO',
        indiceFilho: filhoSelecionado,
        conjuges: filhoAtual.exConjuges,
        netos: netosParaMostrar
      });
    }
  }, [abaFilhoAtiva, dadosFamilia.filhos, filhoSelecionado, exConjugeFilhoSelecionado, setNetoSelecionado, salvarNetosConjugeAtivoFilho, salvarNetosConjugeFilho, carregarNetosConjugeAtivoFilho, carregarNetosConjugeFilho]);

  // Handler para trocar ex-cônjuge do filho com reset da coluna 4
  const handleTrocarExConjugeFilho = useCallback((novoIndice: number) => {
    if (exConjugeFilhoSelecionado === novoIndice) return;
    
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (!filhoAtual) return;
    
    // Salvar netos do cônjuge atual antes de trocar (usar índice da coluna 1)
    const netosAtuais = filhoAtual.filhos || [];
    if (netosAtuais.length > 0) {
      salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtuais);
    }
    
    // Reset da coluna 4 (netos)
    setNetoSelecionado(0);
    
    // Trocar ex-cônjuge do filho
    setExConjugeFilhoSelecionado(novoIndice);
    
    // Carregar netos específicos do novo ex-cônjuge selecionado
    const netosSalvos = carregarNetosConjugeFilho(filhoSelecionado, novoIndice);
    const netosParaMostrar = netosSalvos || [];
    
    dispatch({
      tipo: 'RESTAURAR_ESTADO_FILHO',
      indiceFilho: filhoSelecionado,
      conjuges: filhoAtual.exConjuges,
      netos: netosParaMostrar
    });
  }, [exConjugeFilhoSelecionado, dadosFamilia.filhos, filhoSelecionado, setNetoSelecionado, salvarNetosConjugeFilho, carregarNetosConjugeFilho]);

  // Usar o novo reducer
  const [estadoLocal, dispatch] = useReducer(familiaReducer, dadosFamilia);

  // Sincronizar estado local com o hook usando useCallback para evitar loop infinito
  const sincronizarEstado = useCallback(() => {
    setDadosFamilia(estadoLocal);
  }, [estadoLocal, setDadosFamilia]);

  // Chamar sincronização apenas quando estadoLocal muda via dispatch
  useEffect(() => {
    sincronizarEstado();
  }, [sincronizarEstado]);

  // Carregar dados iniciais apenas uma vez
  useEffect(() => {
    const estadoSalvo = carregarEstadoGeral();
    if (estadoSalvo) {
      // Restaurar cônjuge ativo
      if (estadoSalvo.dados.conjugeAtivo) {
        dispatch({ tipo: 'ADICIONAR_CONJUGE_ATIVO' });
        dispatch({ tipo: 'ATUALIZAR_CONJUGE_ATIVO', dados: estadoSalvo.dados.conjugeAtivo });
        setAbaAtiva('conjuge');
      }
      
      // Restaurar ex-cônjuges
      if (estadoSalvo.dados.exConjuges && estadoSalvo.dados.exConjuges.length > 0) {
        estadoSalvo.dados.exConjuges.forEach((exConjuge, index) => {
          dispatch({ tipo: 'ADICIONAR_EX_CONJUGE' });
          dispatch({ tipo: 'ATUALIZAR_EX_CONJUGE', indice: index, dados: exConjuge });
        });
        if (!estadoSalvo.dados.conjugeAtivo) {
          setAbaAtiva('ex');
        }
      }
      
      // Restaurar índices
      if (estadoSalvo.indices) {
        const { filhoSelecionado: filhoSel } = estadoSalvo.indices;
        setFilhoSelecionado(filhoSel);
        
        // Carregar filhos do cônjuge ativo
        if (estadoSalvo.dados.conjugeAtivo) {
          const filhosSalvos = carregarEstadoConjugeAtivo();
          if (filhosSalvos && filhosSalvos.length > 0) {
            dispatch({ tipo: 'RESTAURAR_FILHOS_CONJUGE', filhos: filhosSalvos });
            
            // Restaurar estado do filho selecionado se existir
            if (filhosSalvos[filhoSel]) {
              const estadoFilho = carregarEstadoFilho(filhoSel);
              if (estadoFilho) {
                dispatch({
                  tipo: 'RESTAURAR_ESTADO_FILHO',
                  indiceFilho: filhoSel,
                  conjuges: estadoFilho.conjuges || [],
                  netos: estadoFilho.filhos || []
                });
                
                if (estadoFilho.indices) {
                  setConjugeFilhoSelecionado(estadoFilho.indices.conjugeFilhoSelecionado);
                  setNetoSelecionado(estadoFilho.indices.netoSelecionado);
                }
              }
            }
          }
        }
      }
    } else if (dadosIniciais && (dadosIniciais.conjugeAtivo || dadosIniciais.exConjuges?.length > 0 || dadosIniciais.filhos?.length > 0)) {
      // Usar dados iniciais se não houver dados salvos
      setDadosFamilia(dadosIniciais);
    }
  }, []); // Executar apenas uma vez na montagem

  // Carregar filhos do contexto ativo apenas na montagem inicial
  useEffect(() => {
    // Só executar se não há filhos carregados ainda (evitar conflito com handleTrocarAba)
    if (dadosFamilia.filhos?.length === 0) {
      if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
        const estadoSalvo = carregarEstadoConjugeAtivo();
        if (estadoSalvo && estadoSalvo.length > 0) {
          estadoSalvo.forEach((filho, indice) => {
            dispatch({ tipo: 'ADICIONAR_FILHO' });
            // Carregar filho sem netos primeiro
            const filhoSemNetos = { ...filho, filhos: [] };
            dispatch({ tipo: 'ATUALIZAR_FILHO', indice, dados: filhoSemNetos });
            
            // Carregar netos específicos do cônjuge ativo para este filho
            const netosSalvos = carregarNetosConjugeAtivoFilho(indice);
            if (netosSalvos && netosSalvos.length > 0) {
              dispatch({
                tipo: 'RESTAURAR_ESTADO_FILHO',
                indiceFilho: indice,
                conjuges: filho.exConjuges || [],
                netos: netosSalvos
              });
            }
          });
        }
      } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
        const estadoSalvo = carregarEstadoExConjuge(exConjugeSelecionado);
        if (estadoSalvo && estadoSalvo.length > 0) {
          estadoSalvo.forEach((filho, indice) => {
            dispatch({ tipo: 'ADICIONAR_FILHO' });
            // Carregar filho sem netos primeiro
            const filhoSemNetos = { ...filho, filhos: [] };
            dispatch({ tipo: 'ATUALIZAR_FILHO', indice, dados: filhoSemNetos });
            
            // Carregar netos específicos do ex-cônjuge para este filho
            const netosSalvos = carregarNetosConjugeFilho(indice, exConjugeSelecionado); // Usar o ex-cônjuge selecionado na coluna 1
            if (netosSalvos && netosSalvos.length > 0) {
              dispatch({
                tipo: 'RESTAURAR_ESTADO_FILHO',
                indiceFilho: indice,
                conjuges: filho.exConjuges || [],
                netos: netosSalvos
              });
            }
          });
        }
      }
    }
  }, [abaAtiva, exConjugeSelecionado, carregarEstadoConjugeAtivo, carregarEstadoExConjuge, carregarNetosConjugeAtivoFilho, carregarNetosConjugeFilho]);

  // Salvar automaticamente quando dados mudarem
  useEffect(() => {
    if (dadosFamilia.conjugeAtivo || dadosFamilia.exConjuges?.length > 0 || dadosFamilia.filhos?.length > 0) {
      salvarEstadoGeral(dadosFamilia, { 
        filhoSelecionado 
      });
      
      // Salvar estado do cônjuge ativo com seus filhos
      if (dadosFamilia.conjugeAtivo) {
        // Salvar filhos atuais se a aba cônjuge estiver ativa, senão manter estado anterior
        if (abaAtiva === 'conjuge') {
          salvarEstadoConjugeAtivo(dadosFamilia.filhos);
        } else {
          // Manter estado anterior do cônjuge ativo quando não está na aba ativa
          const estadoAnterior = carregarEstadoConjugeAtivo();
          if (estadoAnterior) {
            salvarEstadoConjugeAtivo(estadoAnterior);
          }
        }
      }
      
      // Salvar estado dos ex-cônjuges com seus filhos
      if (dadosFamilia.exConjuges && dadosFamilia.exConjuges.length > 0) {
        dadosFamilia.exConjuges.forEach((_, index) => {
          // Salvar filhos do ex-cônjuge ativo ou manter estado anterior dos inativos
          if (abaAtiva === 'ex' && exConjugeSelecionado === index) {
            // Salvar filhos atuais para o ex-cônjuge ativo
            salvarEstadoExConjuge(index, dadosFamilia.filhos);
          } else {
            // Manter estado anterior para ex-cônjuges inativos
            const estadoAnterior = carregarEstadoExConjuge(index);
            if (estadoAnterior) {
              salvarEstadoExConjuge(index, estadoAnterior);
            }
          }
        });
      }
      
      // Salvar estado do filho atual com seus cônjuges e netos
      if (dadosFamilia.filhos?.[filhoSelecionado]) {
        salvarEstadoFilho(filhoSelecionado, dadosFamilia.filhos?.[filhoSelecionado], {
          conjugeFilhoSelecionado,
          netoSelecionado
        });
      }
    }
  }, [dadosFamilia, filhoSelecionado, abaAtiva, exConjugeSelecionado, conjugeFilhoSelecionado, netoSelecionado]);

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onChange?.(dadosFamilia);
  }, [dadosFamilia, onChange]);

  // === VALIDAÇÃO AUTOMÁTICA DE ÍNDICES ===

  // Ajustar índices quando filhos mudarem
  useEffect(() => {
    if (dadosFamilia.filhos?.length === 0) {
      setFilhoSelecionado(0);
      setNetoSelecionado(0);
    } else if (filhoSelecionado >= (dadosFamilia.filhos?.length || 0)) {
      setFilhoSelecionado(Math.max(0, (dadosFamilia.filhos?.length || 0) - 1));
    }
  }, [dadosFamilia.filhos?.length || 0]); // Removido filhoSelecionado das dependências para evitar interferir com o foco automático

  // Ajustar índice de cônjuges do filho quando mudarem
  useEffect(() => {
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (!filhoAtual || filhoAtual.exConjuges.length === 0) {
      setConjugeFilhoSelecionado(0);
    } else if (conjugeFilhoSelecionado >= filhoAtual.exConjuges.length) {
      setConjugeFilhoSelecionado(Math.max(0, filhoAtual.exConjuges.length - 1));
    }
  }, [dadosFamilia.filhos?.[filhoSelecionado]?.exConjuges?.length, filhoSelecionado]);

  // Ajustar índice de netos quando mudarem
  useEffect(() => {
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (!filhoAtual || filhoAtual.filhos.length === 0) {
      setNetoSelecionado(0);
    } else if (netoSelecionado >= filhoAtual.filhos.length) {
      setNetoSelecionado(Math.max(0, filhoAtual.filhos.length - 1));
    }
  }, [dadosFamilia.filhos?.[filhoSelecionado]?.filhos?.length, filhoSelecionado]);

  // Carregar netos corretos quando filho selecionado ou aba ativa muda
  useEffect(() => {
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (!filhoAtual || !abaFilhoAtiva) return;

    let netosParaCarregar: Neto[] = [];

    if (abaFilhoAtiva === 'conjuge' && filhoAtual.conjugeAtivo) {
      // Carregar netos do cônjuge ativo
      const netosSalvos = carregarNetosConjugeAtivoFilho(filhoSelecionado);
      netosParaCarregar = netosSalvos || [];
    } else if (abaFilhoAtiva === 'ex' && filhoAtual.exConjuges?.length > 0) {
      // Carregar netos do ex-cônjuge selecionado na coluna 1
      const netosSalvos = carregarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado);
      netosParaCarregar = netosSalvos || [];
    }

    // Só atualizar se os netos carregados forem diferentes dos atuais
    const netosAtuais = filhoAtual.filhos || [];
    const netosIguais = JSON.stringify(netosAtuais) === JSON.stringify(netosParaCarregar);
    
    if (!netosIguais) {
      dispatch({
        tipo: 'RESTAURAR_ESTADO_FILHO',
        indiceFilho: filhoSelecionado,
        conjuges: filhoAtual.exConjuges,
        netos: netosParaCarregar
      });
    }
  }, [filhoSelecionado, abaFilhoAtiva, exConjugeFilhoSelecionado, carregarNetosConjugeAtivoFilho, carregarNetosConjugeFilho]);

  // === HANDLERS PARA CÔNJUGE ATIVO ===
  const handleAdicionarConjugeAtivo = useCallback(() => {
    // Só permite adicionar se não houver cônjuge ativo (limite: 1 cônjuge ativo)
    if (!dadosFamilia.conjugeAtivo) {
      dispatch({ tipo: 'ADICIONAR_CONJUGE_ATIVO' });
      
      // Reset das colunas subsequentes (colunas 2, 3 e 4)
      setFilhoSelecionado(0);
      setConjugeFilhoSelecionado(0);
      setNetoSelecionado(0);
      setAbaFilhoAtiva(null); // Manter abas deselecionadas após reset
      setExConjugeFilhoSelecionado(0);
      
      // Ativar flag para manter abas deselecionadas temporariamente
      setManterAbasDeselecionadas(true);
      setTimeout(() => {
        setManterAbasDeselecionadas(false);
      }, 500);
      
      // Limpar filhos existentes
      dadosFamilia.filhos.forEach((_, indiceFilho) => {
        removerEstadoFilho(indiceFilho);
      });
    }
  }, [dadosFamilia.conjugeAtivo, dadosFamilia.filhos, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado, setAbaFilhoAtiva, setExConjugeFilhoSelecionado, removerEstadoFilho]);

  const handleRemoverConjugeAtivo = useCallback(() => {
    // Remover estados salvos de todos os filhos
    dadosFamilia.filhos.forEach((_, indiceFilho) => {
      removerEstadoFilho(indiceFilho);
    });
    
    dispatch({ tipo: 'REMOVER_CONJUGE_ATIVO' });
    
    // Reset das colunas dependentes
    setFilhoSelecionado(0);
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
  }, [dadosFamilia.filhos, removerEstadoFilho, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado]);

  const handleConjugeAtivoChange = useCallback((conjuge: Conjuge) => {
    dispatch({ tipo: 'ATUALIZAR_CONJUGE_ATIVO', dados: conjuge });
  }, []);

  // Função adaptadora para FormularioFamiliar
  const handleConjugeAtivoFormChange = useCallback((pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: (pessoa as any).profissao || '',
      rendaMensal: (pessoa as any).rendaMensal || ''
    };
    handleConjugeAtivoChange(conjuge);
  }, [handleConjugeAtivoChange]);



  // === HANDLERS PARA EX-CÔNJUGES ===
  const handleAdicionarExConjuge = useCallback(() => {
    const novoIndice = dadosFamilia.exConjuges?.length || 0;
    dispatch({ tipo: 'ADICIONAR_EX_CONJUGE' });
    
    // Foco automático no novo registro (após o dispatch)
    setExConjugeSelecionado(novoIndice);
    
    // Reset das colunas subsequentes (colunas 2, 3 e 4)
    setFilhoSelecionado(0);
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
    setAbaFilhoAtiva(null); // Manter abas deselecionadas após reset
    setExConjugeFilhoSelecionado(0);
    
    // Ativar flag para manter abas deselecionadas temporariamente
    setManterAbasDeselecionadas(true);
    setTimeout(() => {
      setManterAbasDeselecionadas(false);
    }, 500);
    
    // Limpar todos os filhos existentes (reset para estado inicial)
    dispatch({ tipo: 'RESETAR_FILHOS' });
  }, [dadosFamilia.exConjuges?.length || 0, setExConjugeSelecionado, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado, setAbaFilhoAtiva, setExConjugeFilhoSelecionado]);

  const handleRemoverExConjuge = useCallback((indice: number) => {
    dispatch({ tipo: 'REMOVER_EX_CONJUGE', indice });
    
    // Ajustar seleção
    if (exConjugeSelecionado >= (dadosFamilia.exConjuges?.length || 0) - 1) {
      setExConjugeSelecionado(Math.max(0, (dadosFamilia.exConjuges?.length || 0) - 2));
    }
  }, [dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado]);

  const handleExConjugeChange = useCallback((conjuge: Conjuge) => {
    dispatch({ tipo: 'ATUALIZAR_EX_CONJUGE', indice: exConjugeSelecionado, dados: conjuge });
  }, [exConjugeSelecionado]);

  // Função adaptadora para FormularioFamiliar
  const handleExConjugeFormChange = useCallback((pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: (pessoa as any).profissao || '',
      rendaMensal: (pessoa as any).rendaMensal || ''
    };
    handleExConjugeChange(conjuge);
  }, [handleExConjugeChange]);





  // === HANDLERS PARA FILHOS ===
  const handleAdicionarFilho = useCallback(() => {
    console.log('🔥 [DEBUG ADICIONAR FILHO] Iniciando adição de novo filho');
    console.log('🔥 [DEBUG] Estado atual:', {
      abaAtiva,
      filhoSelecionado,
      abaFilhoAtiva,
      dadosFamiliaFilhos: dadosFamilia.filhos?.length || 0
    });
    
    const novoIndiceFilho = dadosFamilia.filhos?.length || 0;
    console.log('🔥 [DEBUG] Novo índice do filho:', novoIndiceFilho);
    
    dispatch({ tipo: 'ADICIONAR_FILHO' });
    console.log('🔥 [DEBUG] Dispatch ADICIONAR_FILHO executado');
    
    // Foco automático no novo registro (após o dispatch)
    setFilhoSelecionado(novoIndiceFilho);
    console.log('🔥 [DEBUG] setFilhoSelecionado chamado com:', novoIndiceFilho);
    
    // Reset das colunas subsequentes (colunas 3 e 4)
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
    setAbaFilhoAtiva(null); // Iniciar sem aba selecionada para novo filho
    console.log('🔥 [DEBUG] setAbaFilhoAtiva(null) executado - deveria estar deselecionada');
    setExConjugeFilhoSelecionado(0);
    
    // Ativar flag para manter abas deselecionadas por um período
    setManterAbasDeselecionadas(true);
    console.log('🔥 [DEBUG] Flag manterAbasDeselecionadas ativada para novo filho');
    
    // Desativar a flag após um período para permitir seleção automática futura
    setTimeout(() => {
      setManterAbasDeselecionadas(false);
      console.log('🔥 [DEBUG] Flag manterAbasDeselecionadas desativada');
    }, 500);
    
    // Salvar o filho no contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const novoFilho = { nome: '', cpf: '', exConjuges: [], filhos: [], id: '', email: '', celular: '', conjugeAtivo: null };
      salvarEstadoConjugeAtivo([...filhosAtuais, novoFilho]);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const novoFilho = { nome: '', cpf: '', exConjuges: [], filhos: [], id: '', email: '', celular: '', conjugeAtivo: null };
      salvarEstadoExConjuge(exConjugeSelecionado, [...filhosAtuais, novoFilho]);
    }
    
    console.log('🔥 [DEBUG ADICIONAR FILHO] Finalizando função handleAdicionarFilho');
    console.log('🔥 [DEBUG] Estado final esperado: abaFilhoAtiva deveria ser null');
  }, [dadosFamilia.filhos?.length || 0, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, abaAtiva, exConjugeSelecionado, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado, setAbaFilhoAtiva, setExConjugeFilhoSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge]);

  const handleRemoverFilho = useCallback((indice: number) => {
    // Remover estado salvo do filho
    removerEstadoFilho(indice);
    
    // Remover o filho do contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = filhosAtuais.filter((_, i) => i !== indice);
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = filhosAtuais.filter((_, i) => i !== indice);
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
    
    dispatch({ tipo: 'REMOVER_FILHO', indice });
    
    // Ajustar seleção
    if (filhoSelecionado >= (dadosFamilia.filhos?.length || 0) - 1) {
      setFilhoSelecionado(Math.max(0, (dadosFamilia.filhos?.length || 0) - 2));
    }
    
    // Reset das colunas dependentes
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
  }, [dadosFamilia.filhos?.length || 0, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, filhoSelecionado, abaAtiva, exConjugeSelecionado, removerEstadoFilho, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado]);

  const handleFilhoChange = useCallback((filho: Partial<Filho>) => {
    dispatch({ tipo: 'ATUALIZAR_FILHO', indice: filhoSelecionado, dados: filho });
    
    // Salvar a alteração no contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = { ...filhosAtualizados[filhoSelecionado], ...filho };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = { ...filhosAtualizados[filhoSelecionado], ...filho };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
  }, [filhoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge]);

  const handleSelecionarFilho = useCallback((indice: number) => {
    if (indice === filhoSelecionado) return;
    
    // Salvar estado atual antes de trocar
    if (dadosFamilia.filhos?.[filhoSelecionado]) {
      salvarEstadoFilho(filhoSelecionado, dadosFamilia.filhos?.[filhoSelecionado]);
    }
    
    // Trocar para o novo filho (C2→C3,C4 recálculo)
    setFilhoSelecionado(indice);
    
    // Reset das colunas 3 e 4 (limpar à direita)
    setConjugeFilhoSelecionado(0);
    setNetoSelecionado(0);
    setExConjugeFilhoSelecionado(0);
    
    // Resetar flag de seleção manual para permitir seleção automática no novo filho
    setSelecaoManualAbaFilho(false);
    
    // Primeiro, tentar carregar estado salvo da aba para este filho
    const indicesSalvosAba = carregarIndicesExConjuge(exConjugeSelecionado);
    console.log('🔄 [DEBUG SELECAO FILHO] Índices salvos da aba para filho', indice, ':', indicesSalvosAba);
    
    let abaRestaurada = false;
    if (indicesSalvosAba && indicesSalvosAba.filhoSelecionado === indice && indicesSalvosAba.abaFilhoAtiva) {
      console.log('🔄 [DEBUG SELECAO FILHO] Restaurando aba salva:', indicesSalvosAba.abaFilhoAtiva);
      setAbaFilhoAtiva(indicesSalvosAba.abaFilhoAtiva);
      setExConjugeFilhoSelecionado(indicesSalvosAba.conjugeFilhoSelecionado || 0);
      setNetoSelecionado(indicesSalvosAba.netoSelecionado || 0);
      abaRestaurada = true;
    }
    
    // Se não conseguiu restaurar a aba, verificar se há dados antes de aplicar seleção automática
    if (!abaRestaurada) {
      const filhoAtual = dadosFamilia.filhos?.[indice];
      const temConjuge = filhoAtual?.conjugeAtivo;
      const temExConjuges = (filhoAtual?.exConjuges?.length || 0) > 0;
      
      if (temConjuge || temExConjuges) {
        console.log('🔄 [DEBUG SELECAO FILHO] Aplicando seleção automática para filho', indice);
        aplicarSelecaoAutomaticaAba(indice);
      } else {
        console.log('🔄 [DEBUG SELECAO FILHO] Nenhum dado para selecionar - mantendo aba deselecionada para filho', indice);
      }
    }
    
    // Carregar estado salvo do novo filho
    const estadoFilho = carregarEstadoFilho(indice);
    if (estadoFilho) {
      dispatch({
        tipo: 'RESTAURAR_ESTADO_FILHO',
        indiceFilho: indice,
        conjuges: estadoFilho.conjuges || [],
        netos: estadoFilho.filhos || []
      });
      
      // Restaurar índices salvos se existirem (mas não sobrescrever se já restauramos da aba)
      if (estadoFilho.indices && !abaRestaurada) {
        setConjugeFilhoSelecionado(estadoFilho.indices.conjugeFilhoSelecionado);
        setNetoSelecionado(estadoFilho.indices.netoSelecionado);
      }
    } else {
      // Resetar estado do filho se não houver dados salvos
      dispatch({
        tipo: 'RESTAURAR_ESTADO_FILHO',
        indiceFilho: indice,
        conjuges: [],
        netos: []
      });
    }
  }, [filhoSelecionado, dadosFamilia.filhos, salvarEstadoFilho, carregarEstadoFilho, setFilhoSelecionado, setConjugeFilhoSelecionado, setNetoSelecionado]);

  // === HANDLERS PARA CÔNJUGE ATIVO DO FILHO ===
  const handleAdicionarConjugeAtivoFilho = useCallback(() => {
    dispatch({ tipo: 'ADICIONAR_CONJUGE_ATIVO_FILHO', indiceFilho: filhoSelecionado });
    
    // Salvar no contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
    
    // Reset da coluna dependente (netos) ao adicionar cônjuge ativo
    setNetoSelecionado(0);
  }, [filhoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, setNetoSelecionado]);

  const handleRemoverConjugeAtivoFilho = useCallback(() => {
    dispatch({ tipo: 'REMOVER_CONJUGE_ATIVO_FILHO', indiceFilho: filhoSelecionado });
    
    // Remover do contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: null
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: null
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
    
    // Reset da coluna dependente (netos) ao remover cônjuge ativo
    setNetoSelecionado(0);
  }, [filhoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, setNetoSelecionado]);

  const handleConjugeAtivoFilhoChange = useCallback((conjuge: Conjuge) => {
    dispatch({ 
      tipo: 'ATUALIZAR_CONJUGE_ATIVO_FILHO', 
      indiceFilho: filhoSelecionado, 
      dados: conjuge 
    });
    
    // Salvar a alteração no contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: conjuge
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          conjugeAtivo: conjuge
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
  }, [filhoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge]);



  // === HANDLERS PARA EX-CÔNJUGES DO FILHO ===
  const handleAdicionarExConjugeFilho = useCallback(() => {
    const filho = dadosFamilia.filhos?.[filhoSelecionado];
    const novoIndice = filho?.exConjuges?.length || 0;
    
    dispatch({ tipo: 'ADICIONAR_EX_CONJUGE_FILHO', indiceFilho: filhoSelecionado });
    
    // Foco automático no novo registro (após o dispatch)
    // Usar setTimeout para garantir que o estado seja atualizado primeiro
    setTimeout(() => {
      setExConjugeFilhoSelecionado(novoIndice);
    }, 0);
    
    // Reset da coluna subsequente (coluna 4 - netos)
    setNetoSelecionado(0);
    
    // Salvar no contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const exConjugesAtuais = filhosAtualizados[filhoSelecionado].exConjuges || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          exConjuges: [...exConjugesAtuais, { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }]
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const exConjugesAtuais = filhosAtualizados[filhoSelecionado].exConjuges || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          exConjuges: [...exConjugesAtuais, { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }]
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
  }, [filhoSelecionado, dadosFamilia.filhos, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, setExConjugeFilhoSelecionado, setNetoSelecionado]);

  const handleRemoverExConjugeFilho = useCallback((indice: number) => {
    dispatch({ 
      tipo: 'REMOVER_EX_CONJUGE_FILHO', 
      indiceFilho: filhoSelecionado, 
      indice 
    });
    
    // Remover do contexto ativo da primeira coluna
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const exConjugesAtuais = filhosAtualizados[filhoSelecionado].exConjuges || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          exConjuges: exConjugesAtuais.filter((_, i) => i !== indice)
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const exConjugesAtuais = filhosAtualizados[filhoSelecionado].exConjuges || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          exConjuges: exConjugesAtuais.filter((_, i) => i !== indice)
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
    
    const filho = dadosFamilia.filhos?.[filhoSelecionado];
    if (filho && exConjugeFilhoSelecionado >= (filho.exConjuges?.length || 0) - 1) {
      setExConjugeFilhoSelecionado(Math.max(0, (filho.exConjuges?.length || 0) - 2));
    }
  }, [filhoSelecionado, dadosFamilia.filhos, exConjugeFilhoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, setExConjugeFilhoSelecionado]);

  const handleExConjugeFilhoChange = useCallback((exConjuge: Conjuge) => {
    dispatch({ 
      tipo: 'ATUALIZAR_EX_CONJUGE_FILHO', 
      indiceFilho: filhoSelecionado, 
      indice: exConjugeFilhoSelecionado, 
      dados: exConjuge 
    });
  }, [filhoSelecionado, exConjugeFilhoSelecionado]);

  // Função adaptadora para FormularioFamiliar - Cônjuge Ativo de Filho
  const handleConjugeAtivoFilhoFormChange = useCallback((pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: (pessoa as any).profissao || '',
      rendaMensal: (pessoa as any).rendaMensal || 0
    };
    handleConjugeAtivoFilhoChange(conjuge);
  }, [handleConjugeAtivoFilhoChange]);

  // Função adaptadora para FormularioFamiliar - Ex-Cônjuge de Filho
  const handleExConjugeFilhoFormChange = useCallback((pessoa: PessoaFamiliar) => {
    const conjuge: Conjuge = {
      ...pessoa,
      profissao: (pessoa as any).profissao || '',
      rendaMensal: (pessoa as any).rendaMensal || 0
    };
    handleExConjugeFilhoChange(conjuge);
  }, [handleExConjugeFilhoChange]);





  // === HANDLERS PARA NETOS ===
  const handleAdicionarNeto = useCallback(() => {
    const filho = dadosFamilia.filhos?.[filhoSelecionado];
    const novoIndice = filho?.filhos?.length || 0;
    
    dispatch({ tipo: 'ADICIONAR_NETO', indiceFilho: filhoSelecionado });
    
    // Foco automático no novo registro (após o dispatch)
    setNetoSelecionado(novoIndice);
    
    // Salvar netos específicos para o cônjuge atual
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual) {
      const netosAtuais = filhoAtual.filhos || [];
      const novosNetos = [...netosAtuais, { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }];
      
      // Verificar se há cônjuge ativo ou ex-cônjuge selecionado
      if (filhoAtual.conjugeAtivo) {
        // Salvar para cônjuge ativo
        salvarNetosConjugeAtivoFilho(filhoSelecionado, novosNetos);
      } else if (filhoAtual.exConjuges?.[exConjugeFilhoSelecionado]) {
        // Salvar para ex-cônjuge específico (usar índice da coluna 1)
        salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, novosNetos);
      }
    }
    
    // Manter compatibilidade com sistema antigo
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = filhosAtualizados[filhoSelecionado].filhos || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: [...netosAtuais, { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }]
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = filhosAtualizados[filhoSelecionado].filhos || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: [...netosAtuais, { nome: '', cpf: '', profissao: '', rendaMensal: 0, id: '', email: '', celular: '' }]
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
  }, [filhoSelecionado, dadosFamilia.filhos, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, exConjugeFilhoSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, salvarNetosConjugeAtivoFilho, salvarNetosConjugeFilho, setNetoSelecionado]);

  const handleRemoverNeto = useCallback((indiceNeto: number) => {
    dispatch({ 
      tipo: 'REMOVER_NETO', 
      indiceFilho: filhoSelecionado, 
      indiceNeto 
    });
    
    // Remover netos específicos para o cônjuge atual
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual) {
      const netosAtuais = filhoAtual.filhos || [];
      const netosAtualizados = netosAtuais.filter((_, i) => i !== indiceNeto);
      
      // Verificar se há cônjuge ativo ou ex-cônjuge selecionado
      if (filhoAtual.conjugeAtivo) {
        // Salvar para cônjuge ativo
        salvarNetosConjugeAtivoFilho(filhoSelecionado, netosAtualizados);
      } else if (filhoAtual.exConjuges?.[exConjugeFilhoSelecionado]) {
        // Salvar para ex-cônjuge específico (usar índice da coluna 1)
        salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtualizados);
      }
    }
    
    // Manter compatibilidade com sistema antigo
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = filhosAtualizados[filhoSelecionado].filhos || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: netosAtuais.filter((_, i) => i !== indiceNeto)
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = filhosAtualizados[filhoSelecionado].filhos || [];
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: netosAtuais.filter((_, i) => i !== indiceNeto)
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
    
    const filho = dadosFamilia.filhos?.[filhoSelecionado];
    if (filho && netoSelecionado >= filho.filhos.length - 1) {
      setNetoSelecionado(Math.max(0, filho.filhos.length - 2));
    }
  }, [filhoSelecionado, dadosFamilia.filhos, netoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, exConjugeFilhoSelecionado, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, salvarNetosConjugeAtivoFilho, salvarNetosConjugeFilho, setNetoSelecionado]);

  const handleNetoChange = useCallback((neto: Partial<Neto>) => {
    dispatch({ 
      tipo: 'ATUALIZAR_NETO', 
      indiceFilho: filhoSelecionado, 
      indiceNeto: netoSelecionado, 
      dados: neto 
    });
    
    // Salvar alteração específica para o cônjuge atual
    const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];
    if (filhoAtual) {
      const netosAtuais = [...(filhoAtual.filhos || [])];
      if (netosAtuais[netoSelecionado]) {
        netosAtuais[netoSelecionado] = { ...netosAtuais[netoSelecionado], ...neto };
        
        // Verificar se há cônjuge ativo ou ex-cônjuge selecionado
        if (filhoAtual.conjugeAtivo) {
          // Salvar para cônjuge ativo
          salvarNetosConjugeAtivoFilho(filhoSelecionado, netosAtuais);
        } else if (filhoAtual.exConjuges?.[exConjugeFilhoSelecionado]) {
          // Salvar para ex-cônjuge específico (usar índice da coluna 1)
          salvarNetosConjugeFilho(filhoSelecionado, exConjugeSelecionado, netosAtuais);
        }
      }
    }
    
    // Manter compatibilidade com sistema antigo
    if (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo) {
      const filhosAtuais = carregarEstadoConjugeAtivo() || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = [...(filhosAtualizados[filhoSelecionado].filhos || [])];
        if (netosAtuais[netoSelecionado]) {
          netosAtuais[netoSelecionado] = { ...netosAtuais[netoSelecionado], ...neto };
        }
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: netosAtuais
        };
      }
      salvarEstadoConjugeAtivo(filhosAtualizados);
    } else if (abaAtiva === 'ex' && (dadosFamilia.exConjuges?.length || 0) > 0) {
      const filhosAtuais = carregarEstadoExConjuge(exConjugeSelecionado) || [];
      const filhosAtualizados = [...filhosAtuais];
      if (filhosAtualizados[filhoSelecionado]) {
        const netosAtuais = [...(filhosAtualizados[filhoSelecionado].filhos || [])];
        if (netosAtuais[netoSelecionado]) {
          netosAtuais[netoSelecionado] = { ...netosAtuais[netoSelecionado], ...neto };
        }
        filhosAtualizados[filhoSelecionado] = {
          ...filhosAtualizados[filhoSelecionado],
          filhos: netosAtuais
        };
      }
      salvarEstadoExConjuge(exConjugeSelecionado, filhosAtualizados);
    }
  }, [filhoSelecionado, netoSelecionado, abaAtiva, dadosFamilia.conjugeAtivo, dadosFamilia.exConjuges?.length || 0, exConjugeSelecionado, exConjugeFilhoSelecionado, dadosFamilia.filhos, carregarEstadoConjugeAtivo, salvarEstadoConjugeAtivo, carregarEstadoExConjuge, salvarEstadoExConjuge, salvarNetosConjugeAtivoFilho, salvarNetosConjugeFilho]);

  // Dados para renderização
  const conjugeAtivo = dadosFamilia.conjugeAtivo;
  const exConjugeAtual = dadosFamilia.exConjuges?.[exConjugeSelecionado];
  const filhoAtual = dadosFamilia.filhos?.[filhoSelecionado];


  // Função para renderizar placeholders informativos
  const renderizarPlaceholderConjuges = () => {
    const temConjugeAtivo = !!dadosFamilia.conjugeAtivo;
    const temExConjuges = (dadosFamilia.exConjuges?.length || 0) > 0;
    
    if (!abaAtiva) {
      // Nenhuma aba selecionada
      if (!temConjugeAtivo && !temExConjuges) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-2">Clique na aba <strong>Cônjuge</strong> para adicionar um cônjuge ou na aba <strong>Ex</strong> para adicionar um ex-cônjuge.</p>
            
          </div>
        );
      } else {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-1">Selecione uma aba para visualizar</p>
            <p className="text-xs text-center text-gray-300">
              {temConjugeAtivo ? '✓ Cônjuge ativo' : '○ Sem cônjuge ativo'} • 
              {temExConjuges ? `${dadosFamilia.exConjuges?.length || 0} ex-cônjuge(s)` : 'Sem ex-cônjuges'}
            </p>
          </div>
        );
      }
    } else if (abaAtiva === 'conjuge') {
      // Aba cônjuge selecionada
      if (!temConjugeAtivo) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-1">Clique em "+" para adicionar um cônjuge.</p>
          </div>
        );
      }
    } else if (abaAtiva === 'ex') {
      // Aba ex selecionada
      if (!temExConjuges) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-1">Clique em "+" para adicionar um ex-cônjuge.</p>
          </div>
        );
      }
    }
    
    return null;
  };

  // Função para renderizar conteúdo das abas
  const renderizarConteudoAba = () => {
    const placeholder = renderizarPlaceholderConjuges();
    if (placeholder) return placeholder;
    
    if (abaAtiva === 'conjuge' && conjugeAtivo) {
      return (
        <CarrosselFamilia
          itens={[conjugeAtivo]}
          indiceAtivo={0}
          onMudarIndice={() => {}}
          onAdicionarItem={handleAdicionarConjugeAtivo}
          onRemoverItem={handleRemoverConjugeAtivo}
          tituloSingular="Cônjuge"
          tituloPlural="Cônjuges"
          ocultarBotoes={true}
          ocultarTitulo={true}
          ocultarDivisoria={true}
          renderizarItem={(conjuge: Conjuge) => (
            <div className="h-full overflow-y-auto familia-scrollbar">
              <FormularioFamiliar
                pessoa={conjuge}
                onChange={handleConjugeAtivoFormChange}
                mostrarTitulo={false}
              />
            </div>
          )}
          renderizarPlaceholder={() => null}
        />
      );
    } else if (abaAtiva === 'ex' && exConjugeAtual) {
      return (
        <CarrosselFamilia
          itens={dadosFamilia.exConjuges}
          indiceAtivo={exConjugeSelecionado}
          onMudarIndice={handleTrocarExConjuge}
          onAdicionarItem={handleAdicionarExConjuge}
          onRemoverItem={handleRemoverExConjuge}
          tituloSingular="Ex"
          tituloPlural="Ex-Cônjuges"
          ocultarBotoes={true}
          ocultarTitulo={true}
          ocultarDivisoria={true}
          renderizarItem={(conjuge: Conjuge) => (
            <div className="h-full overflow-y-auto familia-scrollbar">
              <FormularioFamiliar
                pessoa={conjuge}
                onChange={handleExConjugeFormChange}
                mostrarTitulo={false}
              />
            </div>
          )}
          renderizarPlaceholder={() => null}
        />
      );
    }
    
    return null;
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Layout de 4 colunas fixas */}
      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        
        {/* Coluna 1: Cônjuges com Abas */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
          
          {/* Botões de Ação no Topo */}
          <div className="flex justify-end mb-3 px-1">
            <div className="flex items-center gap-1">
              {/* Botão adicionar */}
              <button
                 onClick={abaAtiva === 'conjuge' ? handleAdicionarConjugeAtivo : handleAdicionarExConjuge}
                 disabled={abaAtiva === null || (abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo !== null)}
                 className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                   abaAtiva !== null && !(abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo !== null)
                     ? 'bg-[#1777CF] hover:bg-[#1565C0] text-white'
                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                 }`}
                 title={abaAtiva === null ? 'Selecione uma aba primeiro' : 
                        abaAtiva === 'conjuge' && dadosFamilia.conjugeAtivo !== null ? 'Cônjuge já existe (máximo 1)' :
                        `Adicionar ${abaAtiva === 'conjuge' ? 'cônjuge' : 'ex-cônjuge'}`}
               >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              
              {/* Botão remover */}
              <button
                 onClick={abaAtiva === 'conjuge' ? handleRemoverConjugeAtivo : () => handleRemoverExConjuge(exConjugeSelecionado)}
                 disabled={abaAtiva === 'conjuge' ? !dadosFamilia.conjugeAtivo : (dadosFamilia.exConjuges?.length || 0) === 0}
                 className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                   (abaAtiva === 'conjuge' ? dadosFamilia.conjugeAtivo : (dadosFamilia.exConjuges?.length || 0) > 0)
                     ? 'bg-red-500 hover:bg-red-600 text-white'
                     : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                 }`}
                 title={`Remover ${abaAtiva === 'conjuge' ? 'cônjuge' : 'ex-cônjuge'}`}
               >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* Abas com Contadores */}
          <div className="flex justify-center border-b border-gray-200 mt-[2px] mb-[12px]">
            <button
              onClick={() => handleTrocarAba('conjuge')}
              className={`px-4 pb-[10px] pt-[0px] text-sm font-medium transition-colors whitespace-nowrap ${
                abaAtiva === 'conjuge'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Cônjuge ({dadosFamilia.conjugeAtivo ? '01' : '00'})
            </button>
            <button
              onClick={() => handleTrocarAba('ex')}
              className={`px-4 pb-[10px] pt-[0px] text-sm font-medium transition-colors whitespace-nowrap ${
                abaAtiva === 'ex'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ex ({(dadosFamilia.exConjuges?.length || 0).toString().padStart(2, '0')})
            </button>
          </div>
          
          {/* Conteúdo da Aba */}
          <div className="flex-1 min-h-0">
            {renderizarConteudoAba()}
          </div>
        </div>

      {/* Coluna 2: Filhos */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
        <CarrosselFamilia
          itens={dadosFamilia.filhos}
          indiceAtivo={filhoSelecionado}
          onMudarIndice={handleSelecionarFilho}
          onAdicionarItem={handleAdicionarFilho}
          onRemoverItem={handleRemoverFilho}
          tituloSingular="Filho"
          tituloPlural="Filhos"
          desabilitarAdicionar={!dadosFamilia.conjugeAtivo && (dadosFamilia.exConjuges?.length || 0) === 0}
          renderizarItem={(filho: Filho) => (
            <div className="h-full overflow-y-auto familia-scrollbar">
              <FormularioFamiliar
                pessoa={filho}
                onChange={handleFilhoChange}
                mostrarTitulo={false}
                mostrarRegimeBens={false}
              />
            </div>
          )}
          renderizarPlaceholder={() => (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              {(!dadosFamilia.conjugeAtivo && (dadosFamilia.exConjuges?.length || 0) === 0) ? (
                <>
                  <p className="text-sm text-center">Cadastre um cônjuge ou ex-cônjuge para poder adicionar filhos</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-center">Nenhum filho cadastrado</p>
                  <p className="text-xs text-center mt-1">Clique em + para adicionar</p>
                </>
              )}
            </div>
          )}
        />
      </div>

      {/* Coluna 3: Cônjuges do Filho */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
        
        {/* Botões de Ação no Topo */}
        <div className="flex justify-end mb-3 px-1">
          <div className="flex items-center gap-1">
            {/* Botão adicionar */}
            <button
               onClick={abaFilhoAtiva === 'conjuge' ? handleAdicionarConjugeAtivoFilho : handleAdicionarExConjugeFilho}
               disabled={abaFilhoAtiva === null || !filhoAtual || (abaFilhoAtiva === 'conjuge' && filhoAtual?.conjugeAtivo !== null)}
               className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                 abaFilhoAtiva !== null && filhoAtual && !(abaFilhoAtiva === 'conjuge' && filhoAtual?.conjugeAtivo !== null)
                   ? 'bg-[#1777CF] hover:bg-[#1565C0] text-white'
                   : 'bg-gray-300 text-gray-500 cursor-not-allowed'
               }`}
               title={abaFilhoAtiva === null ? 'Selecione uma aba primeiro' : 
                      !filhoAtual ? 'Selecione um filho primeiro' : 
                      abaFilhoAtiva === 'conjuge' && filhoAtual?.conjugeAtivo !== null ? 'Cônjuge do filho já existe (máximo 1)' :
                      `Adicionar ${abaFilhoAtiva === 'conjuge' ? 'cônjuge' : 'ex-cônjuge'} do filho`}
             >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
            
            {/* Botão remover */}
            <button
               onClick={abaFilhoAtiva === 'conjuge' ? handleRemoverConjugeAtivoFilho : () => handleRemoverExConjugeFilho(exConjugeFilhoSelecionado)}
               disabled={abaFilhoAtiva === 'conjuge' ? !filhoAtual?.conjugeAtivo : !filhoAtual || (filhoAtual?.exConjuges?.length || 0) === 0}
               className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                 (abaFilhoAtiva === 'conjuge' ? filhoAtual?.conjugeAtivo : filhoAtual && (filhoAtual?.exConjuges?.length || 0) > 0)
                   ? 'bg-red-500 hover:bg-red-600 text-white'
                   : 'bg-gray-300 text-gray-500 cursor-not-allowed'
               }`}
               title={`Remover ${abaFilhoAtiva === 'conjuge' ? 'cônjuge' : 'ex-cônjuge'} do filho`}
             >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Abas com Contadores */}
        <div className="flex justify-center border-b border-gray-200 mt-[-2px] mb-[10px]">
          <button
            onClick={() => handleTrocarAbaFilho('conjuge')}
            className={`px-4 mt-[3px] mb-[12px] text-sm font-medium transition-colors whitespace-nowrap ${
              abaFilhoAtiva === 'conjuge'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cônjuge ({filhoAtual?.conjugeAtivo ? '01' : '00'})
          </button>
          <button
            onClick={() => handleTrocarAbaFilho('ex')}
            className={`px-4 mt-[3px] mb-[12px] text-sm font-medium transition-colors whitespace-nowrap ${
              abaFilhoAtiva === 'ex'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Ex ({(filhoAtual?.exConjuges?.length || 0).toString().padStart(2, '0')})
          </button>
        </div>

        {/* Placeholder quando não há filho selecionado */}
        {!filhoAtual && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-2">Cadastre um filho para adicionar um cônjuge ou ex-cônjuge.</p>
          </div>
        )}
        
        {/* Placeholder quando ambas as abas estão vazias (00) */}
        {filhoAtual && abaFilhoAtiva === null && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <p className="text-sm text-center mb-2">Nenhum "cônjuge" ou "Ex" cadastrado.</p>
            <p className="text-xs text-center">Clique na aba 'Cônjuge' para adicionar um cônjuge ou na aba 'Ex' para adicionar um ex-cônjuge.</p>
          </div>
        )}
        
        {/* Conteúdo da Aba */}
        {filhoAtual && (
        <div className="flex-1 min-h-0">
          {abaFilhoAtiva === 'conjuge' && filhoAtual?.conjugeAtivo && (
            <CarrosselFamilia
              itens={[filhoAtual.conjugeAtivo]}
              indiceAtivo={0}
              onMudarIndice={() => {}}
              onAdicionarItem={handleAdicionarConjugeAtivoFilho}
              onRemoverItem={handleRemoverConjugeAtivoFilho}
              tituloSingular="Cônjuge"
              tituloPlural="Cônjuge"
              ocultarBotoes={true}
              ocultarTitulo={true}
              ocultarDivisoria={true}
              desabilitarAdicionar={!filhoAtual || !!filhoAtual?.conjugeAtivo}
              renderizarItem={(conjuge: Conjuge) => (
                <div className="h-full overflow-y-auto familia-scrollbar">
                  <FormularioFamiliar
                    pessoa={conjuge}
                    onChange={handleConjugeAtivoFilhoFormChange}
                    mostrarTitulo={false}
                  />
                </div>
              )}
              renderizarPlaceholder={() => null}
            />
          )}
          
          {abaFilhoAtiva === 'conjuge' && !filhoAtual && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <p className="text-sm text-center">Selecione um filho</p>
              <p className="text-xs text-center mt-1">para adicionar cônjuge</p>
            </div>
          )}
          
          {abaFilhoAtiva === 'conjuge' && filhoAtual && !filhoAtual.conjugeAtivo && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <p className="text-sm text-center">Nenhum cônjuge ativo</p>
              <p className="text-xs text-center mt-1">Clique em + para adicionar</p>
            </div>
          )}
          
          {abaFilhoAtiva === 'ex' && filhoAtual && filhoAtual.exConjuges && filhoAtual.exConjuges?.length > 0 && (
            <CarrosselFamilia
              itens={filhoAtual.exConjuges}
              indiceAtivo={exConjugeFilhoSelecionado}
              onMudarIndice={handleTrocarExConjugeFilho}
              onAdicionarItem={handleAdicionarExConjugeFilho}
              onRemoverItem={handleRemoverExConjugeFilho}
              tituloSingular="Ex"
              tituloPlural="Ex-Cônjuges"
              ocultarBotoes={true}
              ocultarTitulo={true}
              ocultarDivisoria={true}
              desabilitarAdicionar={!filhoAtual}
              renderizarItem={(exConjuge: Conjuge) => (
                <div className="h-full overflow-y-auto familia-scrollbar">
                  <FormularioFamiliar
                    pessoa={exConjuge}
                    onChange={handleExConjugeFilhoFormChange}
                    mostrarTitulo={false}
                  />
                </div>
              )}
              renderizarPlaceholder={() => null}
            />
          )}
          
          {abaFilhoAtiva === 'ex' && !filhoAtual && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <p className="text-sm text-center">Selecione um filho</p>
              <p className="text-xs text-center mt-1">para ver ex-cônjuges</p>
            </div>
          )}
          
          {abaFilhoAtiva === 'ex' && filhoAtual && (!filhoAtual.exConjuges || filhoAtual.exConjuges?.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <p className="text-sm text-center">Nenhum ex-cônjuge</p>
              <p className="text-xs text-center mt-1">Clique em + para adicionar</p>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Coluna 4: Filhos do Filho (Netos) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col min-h-0">
        <CarrosselFamilia
          itens={filhoAtual?.filhos || []}
          indiceAtivo={netoSelecionado}
          onMudarIndice={setNetoSelecionado}
          onAdicionarItem={handleAdicionarNeto}
          onRemoverItem={handleRemoverNeto}
          tituloSingular="Filho do Filho"
          tituloPlural="Filhos do Filho"
          desabilitarAdicionar={!filhoAtual}
          renderizarItem={(neto: Neto) => (
            <div className="h-full overflow-y-auto familia-scrollbar">
              <FormularioFamiliar
                pessoa={neto}
                onChange={handleNetoChange}
                mostrarTitulo={false}
                mostrarRegimeBens={false}
              />
            </div>
          )}
          renderizarPlaceholder={() => (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              {!filhoAtual ? (
                <>
                  <p className="text-sm text-center">Selecione um filho</p>
                  <p className="text-sm text-center ">para ver seus filhos (netos)</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-center">Nenhum neto cadastrado</p>
                  <p className="text-xs text-center mt-1">Clique em + para adicionar</p>
                </>
              )}
            </div>
          )}
        />
      </div>
      </div>


    </div>
  );
};

export default SecaoFamiliaV2;