import React, { useState, useEffect, useRef } from 'react';
import { X, Edit2, Trash2, MessageCircle, ChevronDown, Search, Briefcase } from 'lucide-react';

interface Comentario {
  id: string; 
  texto: string;
  responsavel: {
    nome: string;
    foto: string;
  };
  data: string;
  hora: string;
  produto: string;
  etapa: string;
  fase: string;
}

interface ModalComentariosProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalComentarios: React.FC<ModalComentariosProps> = ({ isOpen, onClose }) => {
  const [comentariosPorProduto, setComentariosPorProduto] = useState<{[key: string]: Comentario[]}>({});
  const [novoComentario, setNovoComentario] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [textoEditando, setTextoEditando] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Estados para os filtros (similar ao Modal-HistoricoCliente.tsx)
  const [produtoSelecionado, setProdutoSelecionado] = useState('Declaração de Imposto de Renda');
  const [etapaSelecionada, setEtapaSelecionada] = useState('');
  const [faseSelecionada, setFaseSelecionada] = useState('');
  const [dropdownProdutoAberto, setDropdownProdutoAberto] = useState(false);
  const [dropdownEtapaAberto, setDropdownEtapaAberto] = useState(false);
  const [dropdownFaseAberto, setDropdownFaseAberto] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaEtapa, setBuscaEtapa] = useState('');
  const [buscaFase, setBuscaFase] = useState('');
  
  // Estados do carrossel vertical
  const [comentarioAtualIndex, setComentarioAtualIndex] = useState(0);
  const [todosComentarios, setTodosComentarios] = useState<Comentario[]>([]);
  const [isTextareaSuspended, setIsTextareaSuspended] = useState(false);
  const scrollLockRef = useRef<number | null>(null);

  // Lista de produtos disponíveis
  const produtos = [
    {
      id: 'declaracao-ir',
      nome: 'Declaração de Imposto de Renda',
      etapa: 'Contato Inicial',
      fase: 'Contato'
    },
    {
      id: 'contabilidade-empresarial',
      nome: 'Contabilidade Empresarial',
      etapa: 'Desenvolvimento',
      fase: 'Em Andamento'
    },
    {
      id: 'planejamento-tributario',
      nome: 'Planejamento Tributário',
      etapa: 'Revisão',
      fase: 'Finalizada'
    },
    {
      id: 'holding-patrimonial',
      nome: 'Holding Patrimonial',
      etapa: 'Análise',
      fase: 'Inicial'
    }
  ];

  // Informações do usuário atual
  const usuarioAtual = {
    nome: 'João Silva',
    foto: ''
  };

  // Dados de etapas e fases (simulando estrutura do Modal-HistoricoCliente.tsx)
  const produtosUnicos = ['Declaração de Imposto de Renda', 'Contabilidade Empresarial', 'Planejamento Tributário', 'Holding Patrimonial'];
  
  const etapasUnicas = [
    { id: '1', numero: 1, nome: 'Entrar em contato com o cliente' },
    { id: '2', numero: 2, nome: 'Qualificação e análise do cliente' },
    { id: '3', numero: 3, nome: 'Proposta e negociação' },
    { id: '4', numero: 4, nome: 'Fechamento e implementação' }
  ];

  const fasesUnicas = [
    { id: '1-1', numero: 1, nome: 'Primeiro contato telefônico' },
    { id: '1-2', numero: 2, nome: 'Envio de material informativo' },
    { id: '2-1', numero: 3, nome: 'Coleta de informações' },
    { id: '2-2', numero: 4, nome: 'Análise de perfil' },
    { id: '3-1', numero: 5, nome: 'Elaboração de proposta' },
    { id: '3-2', numero: 6, nome: 'Negociação de valores' }
  ];

  // Comentários fictícios para demonstração
  const comentariosFicticios: Comentario[] = [
    {
      id: '1',
      texto: '111',
      responsavel: { nome: 'João Silva', foto: '' },
      data: '24/07/25',
      hora: '14:21',
      produto: 'Declaração de Imposto de Renda',
      etapa: 'Entrar em contato com o cliente',
      fase: 'Primeiro contato telefônico'
    },
    {
      id: '2',
      texto: '2222',
      responsavel: { nome: 'João Silva', foto: '' },
      data: '24/07/25',
      hora: '14:21',
      produto: 'Declaração de Imposto de Renda',
      etapa: 'Entrar em contato com o cliente',
      fase: 'Primeiro contato telefônico'
    },
    {
      id: '3',
      texto: '2222',
      responsavel: { nome: 'João Silva', foto: '' },
      data: '24/07/25',
      hora: '14:21',
      produto: 'Planejamento Tributário',
      etapa: 'Qualificação e análise do cliente',
      fase: 'Coleta de informações'
    }
  ];

  // Guardar os valores atuais do cliente (para o botão "Atual")
  const clienteAtual = {
    produto: produtos.find(p => p.id === 'declaracao-ir')?.nome || 'Declaração de Imposto de Renda',
    etapa: 'Entrar em contato com o cliente',
    fase: 'Primeiro contato telefônico'
  };

  // Inicializar dados ao montar o componente
  useEffect(() => {
    // Tentar carregar comentários salvos do localStorage
    const comentariosSalvos = localStorage.getItem('modalComentarios_comentarios');
    
    if (comentariosSalvos) {
      try {
        const comentariosParseados = JSON.parse(comentariosSalvos);
        setComentariosPorProduto(comentariosParseados);
        
        // Reconstruir array de todos os comentários
        const todosComentariosArray = Object.values(comentariosParseados).flat() as Comentario[];
        setTodosComentarios(todosComentariosArray);
      } catch (error) {
        console.error('Erro ao carregar comentários salvos:', error);
        // Usar comentários fictícios como fallback
        inicializarComentariosFicticios();
      }
    } else {
      // Primeira vez - usar comentários fictícios
      inicializarComentariosFicticios();
    }
 }, []);

 // Função para inicializar com comentários fictícios
 const inicializarComentariosFicticios = () => {
   setTodosComentarios(comentariosFicticios);
   
   const comentariosPorProd = comentariosFicticios.reduce((acc, comentario) => {
     if (!acc[comentario.produto]) {
       acc[comentario.produto] = [];
     }
     acc[comentario.produto].push(comentario);
     return acc;
   }, {} as {[key: string]: Comentario[]});
   
   setComentariosPorProduto(comentariosPorProd);
 };

 // Salvar comentários no localStorage sempre que mudarem
 useEffect(() => {
   if (Object.keys(comentariosPorProduto).length > 0) {
     localStorage.setItem('modalComentarios_comentarios', JSON.stringify(comentariosPorProduto));
     
     // Atualizar array de todos os comentários
     const todosComentariosArray = Object.values(comentariosPorProduto).flat() as Comentario[];
     setTodosComentarios(todosComentariosArray);
   }
 }, [comentariosPorProduto]);


  // Atualizar filtros com base no comentário atual
  useEffect(() => {
    if (todosComentarios.length > 0 && comentarioAtualIndex < todosComentarios.length) {
      const comentarioAtual = todosComentarios[comentarioAtualIndex];
      setProdutoSelecionado(comentarioAtual.produto);
      
      // Encontrar IDs das etapas e fases correspondentes
      const etapaCorrespondente = etapasUnicas.find(e => e.nome === comentarioAtual.etapa);
      const faseCorrespondente = fasesUnicas.find(f => f.nome === comentarioAtual.fase);
      
      if (etapaCorrespondente) {
        setEtapaSelecionada(etapaCorrespondente.id);
      }
      if (faseCorrespondente) {
        setFaseSelecionada(faseCorrespondente.id);
      }
    }
  }, [comentarioAtualIndex, todosComentarios]);

  // Navegação do carrossel
  const navegarParaCima = () => {
    if (comentarioAtualIndex > 0) {
      setComentarioAtualIndex(comentarioAtualIndex - 1);
    }
  };

  const navegarParaBaixo = () => {
    if (comentarioAtualIndex < comentariosPorFase().length - 1) {
      setComentarioAtualIndex(comentarioAtualIndex + 1);
    }
  };

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Produtos
      const dropdownProdutos = document.querySelector('[data-dropdown-produtos]');
      if (dropdownProdutoAberto && dropdownProdutos && !dropdownProdutos.contains(target)) {
        setDropdownProdutoAberto(false);
        setBuscaProduto('');
      }
      
      // Etapas
      const dropdownEtapas = document.querySelector('[data-dropdown-etapas]');
      if (dropdownEtapaAberto && dropdownEtapas && !dropdownEtapas.contains(target)) {
        setDropdownEtapaAberto(false);
        setBuscaEtapa('');
      }
      
      // Fases
      const dropdownFases = document.querySelector('[data-dropdown-fases]');
      if (dropdownFaseAberto && dropdownFases && !dropdownFases.contains(target)) {
        setDropdownFaseAberto(false);
        setBuscaFase('');
      }
    };

    if (dropdownProdutoAberto || dropdownEtapaAberto || dropdownFaseAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownProdutoAberto, dropdownEtapaAberto, dropdownFaseAberto]);

  // Reset do textarea quando o conteúdo é limpo
  useEffect(() => {
    if (!novoComentario) {
      setIsTextareaSuspended(false);
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.style.height = '40px';
        }
      }, 0);
    }
  }, [novoComentario]);


  // Função para contar comentários por produto
  const contarComentariosPorProduto = (produto: string) => {
    return comentariosPorProduto[produto]?.length || 0;
  };

  // Função para contar comentários por etapa
  const contarComentariosPorEtapa = (etapaId: string) => {
    const etapa = etapasUnicas.find(e => e.id === etapaId);
    if (!etapa) return 0;
    return todosComentarios.filter(c => c.etapa === etapa.nome).length;
  };

  // Função para contar comentários por fase
  const contarComentariosPorFase = (faseId: string) => {
    const fase = fasesUnicas.find(f => f.id === faseId);
    if (!fase) return 0;
    return todosComentarios.filter(c => c.fase === fase.nome).length;
  };

 // Função para contar fases com comentários
 const contarFasesComComentarios = () => {
   const fasesComComentarios = new Set(todosComentarios.map(c => c.fase));
   return fasesComComentarios.size;
 };

 // Função para agrupar comentários por fase
 const comentariosPorFase = () => {
   const agrupados: { [key: string]: Comentario[] } = {};
   todosComentarios.forEach(comentario => {
     if (!agrupados[comentario.fase]) {
       agrupados[comentario.fase] = [];
     }
     agrupados[comentario.fase].push(comentario);
   });
   
    // Criar array ordenado apenas das fases que têm comentários
    const fasesComComentarios = Object.keys(agrupados)
      .map(nomeFase => {
        const faseInfo = fasesUnicas.find(f => f.nome === nomeFase);
        return {
          nome: nomeFase,
          numeroOriginal: faseInfo?.numero || 0,
          comentarios: agrupados[nomeFase]
        };
      })
      .sort((a, b) => a.numeroOriginal - b.numeroOriginal);

   
   return fasesComComentarios;
 };

  // Função para gerar foto de avatar baseada no nome
  const gerarAvatar = (nome: string) => {
    const cores = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
    const corIndex = nome.length % cores.length;
    const iniciais = nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    
    return (
      <div className={`w-10 h-10 rounded-full ${cores[corIndex]} flex items-center justify-center text-white font-medium text-sm`}>
        {iniciais}
      </div>
    );
  };

  // Filtrar produtos para busca
  const produtosFiltrados = produtosUnicos.filter(produto => 
    produto.toLowerCase().includes(buscaProduto.toLowerCase())
  );

  const selecionarProduto = (produto: string) => {
    setProdutoSelecionado(produto);
    setDropdownProdutoAberto(false);
    setBuscaProduto('');
    // Resetar seleções dependentes
    setEtapaSelecionada('');
    setFaseSelecionada('');
  };

  // Filtrar etapas para busca
  const etapasFiltradasDropdown = etapasUnicas.filter(etapa => 
    etapa.nome.toLowerCase().includes(buscaEtapa.toLowerCase()) ||
    String(etapa.numero).padStart(2, '0').includes(buscaEtapa)
  );

  const selecionarEtapa = (etapaId: string) => {
    setEtapaSelecionada(etapaId);
    setDropdownEtapaAberto(false);
    setBuscaEtapa('');
    // Resetar seleção de fase ao mudar etapa
    setFaseSelecionada('');
  };

  // Filtrar fases para busca
  const fasesFiltradasDropdown = fasesUnicas.filter(fase => 
    fase.nome.toLowerCase().includes(buscaFase.toLowerCase()) ||
    String(fase.numero).padStart(2, '0').includes(buscaFase)
  );

  const selecionarFase = (faseId: string) => {
    setFaseSelecionada(faseId);
    setDropdownFaseAberto(false);
    setBuscaFase('');
  };

  // Função para voltar ao filtro atual
  const voltarParaAtual = () => {
    setProdutoSelecionado(clienteAtual.produto);
    setEtapaSelecionada('1'); // ID da etapa atual
    setFaseSelecionada('1-1'); // ID da fase atual
  };

  // Função para cancelar e resetar
  const cancelarComentario = () => {
    setNovoComentario('');
    setIsTextareaSuspended(false);
    
    // Resetar altura do textarea
    setTimeout(() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '40px';
      }
    }, 0);
  };

  const produtoAtual = produtoSelecionado || produtosUnicos[0];
  const comentariosAtual = comentariosPorProduto[produtoSelecionado] || [];

  const adicionarComentario = () => {
    if (novoComentario.trim()) {
      const agora = new Date();
      const dataFormatada = agora.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit' 
      });
      const horaFormatada = agora.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      const novoComentarioObj: Comentario = {
        id: Date.now().toString(),
        texto: novoComentario,
        responsavel: {
          nome: usuarioAtual.nome,
          foto: ''
        },
        data: dataFormatada,
        hora: horaFormatada,
        produto: produtoAtual,
        etapa: etapaSelecionada || 'Atual',
        fase: faseSelecionada || 'Atual'
      };

      setComentariosPorProduto(prev => ({
        ...prev,
        [produtoAtual]: [...(prev[produtoAtual] || []), novoComentarioObj]
      }));

      // Limpar e resetar estado
      setNovoComentario('');
      setIsTextareaSuspended(false);
      
      // Resetar altura do textarea
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.style.height = '40px';
        }
      }, 0);
    }
  };

  const editarComentario = (id: string, novoTexto: string) => {
    setComentariosPorProduto(prev => ({
      ...prev,
      [produtoAtual]: prev[produtoAtual]?.map(c => 
        c.id === id ? { ...c, texto: novoTexto } : c
      ) || []
    }));
    setEditandoId(null);
    setTextoEditando('');
  };

  const excluirComentario = (id: string) => {
    setComentariosPorProduto(prev => ({
      ...prev,
      [produtoAtual]: prev[produtoAtual]?.filter(c => c.id !== id) || []
    }));
  };

 // Função para limpar todos os dados salvos (opcional - para debug/reset)
 const limparDadosSalvos = () => {
   localStorage.removeItem('modalComentarios_comentarios');
   inicializarComentariosFicticios();
 };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-[10px]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full h-full max-h-[calc(100vh-20px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header - Largura Total no Topo */}
        <div className="bg-white border-b border-gray-200 p-6 rounded-t-2xl relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                JS
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{usuarioAtual.nome}</h2>
                <p className="text-sm text-gray-500">Cliente desde 01/05/24</p>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <h1 className="text-xl font-bold text-gray-900">Comentários</h1>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Container Principal com Carrossel + Conteúdo */}
        <div className="flex-1 flex gap-[10px] p-[10px] overflow-hidden">
          
          {/* Carrossel Vertical - Lado Esquerdo (Mais Slim) */}
          <div className="w-[100px] flex flex-col bg-gray-50 rounded-xl border border-gray-200">
            {/* Contador de Comentários */}
            <div className="p-2 border-b border-gray-200 bg-white rounded-t-xl">
              <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                  {String(contarFasesComComentarios()).padStart(2, '0')}/{String(todosComentarios.length).padStart(2, '0')}
                </div>

                <div className="text-xs text-gray-500 leading-tight">Total</div>
              </div>
            </div>

            {/* Carrossel Vertical com Abas */}
            <div className="flex-1 flex flex-col">
              {/* Seta para Cima */}
              <div className="p-1">
                <button
                  onClick={navegarParaCima}
                  disabled={comentarioAtualIndex === 0}
                  className={`w-full h-[30px] rounded flex items-center justify-center text-sm font-medium transition-colors border ${
                    comentarioAtualIndex === 0 
                      ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                  }`}
                >
                  <svg width="40" height="14" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M11.2792 6.7762C10.8964 7.1345 10.9088 7.70424 11.3069 8.04875L16.5572 12.5L11.3069 16.9513C10.9088 17.2958 10.8964 17.8655 11.2792 18.2238C11.662 18.5821 12.295 18.5933 12.6931 18.2487L18.6931 13.1487C18.8892 12.9791 19 12.7448 19 12.5C19 12.2552 18.8892 12.0209 18.6931 11.8513L12.6931 6.75125C12.295 6.40674 11.662 6.41791 11.2792 6.7762Z" 
                      fill="currentColor"
                      transform="rotate(270 15 12.5)"
                    />
                  </svg>
                </button>
              </div>

              {/* Abas Numeradas Verticais */}
              <div className="flex-1 flex flex-col gap-[6px] p-1 overflow-y-auto scrollbar-hide">
                {comentariosPorFase().map((fase, index) => (
                  <button
                    key={index}
                    onClick={() => setComentarioAtualIndex(index)}
                    className={`w-full h-[40px] rounded flex items-center justify-center text-sm font-medium transition-colors border ${
                      index === comentarioAtualIndex
                        ? 'bg-[#1777CF] text-[#FCFCFC] border-[#D8E0F0]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}/{String(fase.comentarios.length).padStart(2, '0')}
                  </button>
                ))}
              </div>

              {/* Seta para Baixo */}
              <div className="p-1">
                <button
                  onClick={navegarParaBaixo}
                  disabled={comentarioAtualIndex === comentariosPorFase().length - 1}
                  className={`w-full h-[30px] rounded flex items-center justify-center text-sm font-medium transition-colors border ${
                    comentarioAtualIndex === comentariosPorFase().length - 1
                      ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' 
                      : 'bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300'
                  }`}
                >
                  <svg width="40" height="14" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path 
                      fillRule="evenodd" 
                      clipRule="evenodd" 
                      d="M11.2792 6.7762C10.8964 7.1345 10.9088 7.70424 11.3069 8.04875L16.5572 12.5L11.3069 16.9513C10.9088 17.2958 10.8964 17.8655 11.2792 18.2238C11.662 18.5821 12.295 18.5933 12.6931 18.2487L18.6931 13.1487C18.8892 12.9791 19 12.7448 19 12.5C19 12.2552 18.8892 12.0209 18.6931 11.8513L12.6931 6.75125C12.295 6.40674 11.662 6.41791 11.2792 6.7762Z" 
                      fill="currentColor"
                      transform="rotate(90 15 12.5)"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal - Lado Direito */}
          <div className="flex-1 flex flex-col gap-[10px] overflow-hidden">
            
            {/* Container dos 3 Dropdowns + Input */}
            <div className="bg-gray-50 p-[15px] rounded-lg border border-gray-200 space-y-4 mb-[10px]">
              
              {/* Linha dos 3 Dropdowns */}
              <div className="flex gap-[10px] items-center">    

                <div className="flex-1 min-w-0 max-w-full relative" data-dropdown-produtos>
                  <button
                    onClick={() => setDropdownProdutoAberto(!dropdownProdutoAberto)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors" 
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <Briefcase size={16} className="text-gray-600 flex-shrink-0" />
                      <span className="text-gray-900 truncate block min-w-0">{produtoAtual}</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-1 ${dropdownProdutoAberto ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownProdutoAberto && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      <div className="p-[10px] border-b border-gray-100">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={buscaProduto}
                            onChange={(e) => setBuscaProduto(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {produtosFiltrados.length > 0 ? (
                          produtosFiltrados.map((produto, index) => (
                            <div key={produto}>
                              <button
                                onClick={() => selecionarProduto(produto)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                  produto === produtoSelecionado ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between min-w-0 flex-1">
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                      {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <span className="font-normal truncate text-[14px]">{produto}</span>
                                  </div>
                                  <div className="flex items-center space-x-1 ml-2">
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      width="14" 
                                      height="12" 
                                      viewBox="0 0 18 16" 
                                      fill="none"
                                      className="flex-shrink-0"
                                    >
                                      <path 
                                        d="M8.99512 0.0996094C13.6452 0.0996539 17.4003 3.39177 17.4004 7.42676C17.4004 11.462 13.6549 14.7539 9.00488 14.7539C7.78621 14.7539 6.63057 14.5272 5.58691 14.1211L5.5332 14.1006L5.48828 14.1357C5.09915 14.4418 4.45881 14.8631 3.70605 15.2168C3.20638 15.4502 2.64642 15.6613 2.06543 15.7842L2.06055 15.7852L1.99316 15.8008L1.9873 15.8018C1.84444 15.8297 1.701 15.8505 1.55664 15.8682L1.55371 15.8691L1.53516 15.8721C1.36865 15.8896 1.20216 15.9004 1.03711 15.9004C0.866682 15.9002 0.709052 15.7896 0.639648 15.6104C0.569959 15.4303 0.607251 15.2287 0.732422 15.0938L0.734375 15.0918C0.870133 14.9384 0.997313 14.77 1.11523 14.5996L1.11621 14.6006L1.11816 14.5977C1.17117 14.5157 1.22434 14.4336 1.27734 14.3516L1.28125 14.3457L1.29004 14.3271C1.34961 14.2309 1.40587 14.1345 1.45898 14.0381L1.45996 14.0391C1.79639 13.4381 2.11819 12.6449 2.18262 11.751L2.18555 11.7109L2.16016 11.6807C1.17788 10.4793 0.599609 9.01196 0.599609 7.42676C0.599706 3.3916 4.34518 0.0996094 8.99512 0.0996094ZM8.99512 1.61426C4.81341 1.61426 1.99327 4.52213 1.99316 7.42676C1.99316 8.59359 2.41334 9.7147 3.19922 10.6699V10.6709C3.46514 11.0008 3.60073 11.4334 3.56934 11.8691C3.52359 12.505 3.38345 13.0888 3.2002 13.6064L3.11719 13.8389L3.33887 13.7295C3.9122 13.4445 4.38563 13.1266 4.66309 12.9082L4.66406 12.9072C5.06435 12.5903 5.58067 12.5146 6.04492 12.6943C6.93579 13.0416 7.934 13.2402 8.99512 13.2402C13.1768 13.2402 15.9971 10.3314 15.9971 7.42676C15.997 4.52215 13.1768 1.6143 8.99512 1.61426ZM5.27832 6.38477C5.53096 6.38477 5.77501 6.49269 5.95605 6.6875C6.13716 6.8825 6.2402 7.14815 6.24023 7.42676C6.24023 7.70554 6.13733 7.97193 5.95605 8.16699C5.77502 8.36173 5.53091 8.46973 5.27832 8.46973C5.02572 8.46969 4.7816 8.36177 4.60059 8.16699C4.41932 7.97194 4.31641 7.70554 4.31641 7.42676C4.31644 7.14821 4.41956 6.88249 4.60059 6.6875C4.7816 6.49272 5.02572 6.3848 5.27832 6.38477ZM8.99512 6.38477C9.24773 6.38479 9.49183 6.49271 9.67285 6.6875C9.85389 6.88249 9.95699 7.1482 9.95703 7.42676C9.95703 7.70554 9.85413 7.97193 9.67285 8.16699C9.49183 8.36178 9.24772 8.4697 8.99512 8.46973C8.74252 8.46973 8.49842 8.36174 8.31738 8.16699C8.1361 7.97193 8.0332 7.70554 8.0332 7.42676C8.03324 7.14815 8.13629 6.8825 8.31738 6.6875C8.49843 6.49269 8.74247 6.38477 8.99512 6.38477ZM12.7119 6.38477C12.9644 6.38486 13.2087 6.49277 13.3896 6.6875C13.5706 6.88248 13.6738 7.14825 13.6738 7.42676C13.6738 7.70549 13.5709 7.97194 13.3896 8.16699C13.2087 8.36172 12.9644 8.46964 12.7119 8.46973C12.4594 8.46973 12.2152 8.36167 12.0342 8.16699C11.8529 7.97193 11.75 7.70554 11.75 7.42676C11.75 7.1481 11.853 6.88251 12.0342 6.6875C12.2152 6.49269 12.4593 6.38477 12.7119 6.38477Z" 
                                        fill={contarComentariosPorProduto(produto) > 0 ? '#1777CF' : '#91929E'} 
                                        stroke="#FCFCFC" 
                                        strokeWidth={0.2}
                                      />
                                    </svg>
                                    <span 
                                      className={`text-xs font-medium min-w-[20px] text-center ${
                                        contarComentariosPorProduto(produto) > 0 ? 'text-[#1777CF]' : 'text-gray-400'
                                      }`}
                                    >
                                      {String(contarComentariosPorProduto(produto)).padStart(2, '0')}
                                    </span>
                                  </div>
                                </div>
                              </button>
                              {index < produtosFiltrados.length - 1 && (
                                <div className="border-b border-gray-100 mx-[10px]"></div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500 mb-2">Nenhum produto encontrado</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 max-w-full relative" data-dropdown-etapas>
                  <button
                    onClick={() => setDropdownEtapaAberto(!dropdownEtapaAberto)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="13" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                          <path d="M16.7333 0.5H14.4219H8.16719C8.01992 0.5 7.90052 0.616341 7.90052 0.759833V3.34839H6.36563C6.21836 3.34839 6.09896 3.46473 6.09896 3.60822V5.7663H4.56393C4.41667 5.7663 4.29727 5.88264 4.29727 6.02614V8.71403H3.17031C3.02305 8.71403 2.90365 8.83037 2.90365 8.97386V11.3969H1.26667C1.1194 11.3969 1 11.5132 1 11.6567V14.2402C1 14.3837 1.1194 14.5 1.26667 14.5H16.7333C16.8806 14.5 17 14.3837 17 14.2402V0.759833C17 0.616341 16.8806 0.5 16.7333 0.5ZM14.1552 1.01967V3.34839H12.6202H8.43385V1.01967H14.1552ZM8.16719 3.86805H12.3535V5.7663H10.8186H6.63229V3.86805H8.16719ZM6.36563 6.28597H10.552V8.71403H9.42487H4.8306V6.28597H6.36563ZM4.56393 9.2337H9.1582V11.3969H7.52135H3.43698V9.2337H4.56393ZM1.53333 11.9165H3.17031H7.25469V13.9803H1.53333V11.9165ZM16.4667 13.9803H7.78802V11.9165H9.42487C9.57214 11.9165 9.69154 11.8002 9.69154 11.6567V9.2337H10.8186C10.9659 9.2337 11.0853 9.11736 11.0853 8.97386V6.28597H12.6202C12.7674 6.28597 12.8868 6.16963 12.8868 6.02614V3.86805H14.4219C14.5691 3.86805 14.6885 3.75171 14.6885 3.60822V1.01967H16.4667V13.9803Z" fill="currentColor" stroke="currentColor" strokeWidth="0.3"/>
                        </svg>
                      </div>
                      <span className="text-gray-900 truncate block min-w-0">
                        {etapaSelecionada ? etapasUnicas.find(e => e.id === etapaSelecionada)?.nome || 'Selecione uma etapa' : 'Entrar em contato com o cliente'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-1 ${dropdownEtapaAberto ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownEtapaAberto && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      <div className="p-[10px] border-b border-gray-100">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar etapa..."
                            value={buscaEtapa}
                            onChange={(e) => setBuscaEtapa(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {etapasFiltradasDropdown.length > 0 ? (
                          etapasFiltradasDropdown.map((etapa, index) => {
                            const numeroFormatado = String(etapa.numero).padStart(2, '0');
                            return (
                              <div key={etapa.id}>
                                <button
                                  onClick={() => selecionarEtapa(etapa.id)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                    etapa.id === etapaSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between min-w-0 flex-1">
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                      <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                        {numeroFormatado}
                                      </span>
                                      <span className="font-normal truncate text-[14px]">{etapa.nome}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="14" 
                                        height="12" 
                                        viewBox="0 0 18 16" 
                                        fill="none"
                                        className="flex-shrink-0"
                                      >
                                        <path 
                                          d="M8.99512 0.0996094C13.6452 0.0996539 17.4003 3.39177 17.4004 7.42676C17.4004 11.462 13.6549 14.7539 9.00488 14.7539C7.78621 14.7539 6.63057 14.5272 5.58691 14.1211L5.5332 14.1006L5.48828 14.1357C5.09915 14.4418 4.45881 14.8631 3.70605 15.2168C3.20638 15.4502 2.64642 15.6613 2.06543 15.7842L2.06055 15.7852L1.99316 15.8008L1.9873 15.8018C1.84444 15.8297 1.701 15.8505 1.55664 15.8682L1.55371 15.8691L1.53516 15.8721C1.36865 15.8896 1.20216 15.9004 1.03711 15.9004C0.866682 15.9002 0.709052 15.7896 0.639648 15.6104C0.569959 15.4303 0.607251 15.2287 0.732422 15.0938L0.734375 15.0918C0.870133 14.9384 0.997313 14.77 1.11523 14.5996L1.11621 14.6006L1.11816 14.5977C1.17117 14.5157 1.22434 14.4336 1.27734 14.3516L1.28125 14.3457L1.29004 14.3271C1.34961 14.2309 1.40587 14.1345 1.45898 14.0381L1.45996 14.0391C1.79639 13.4381 2.11819 12.6449 2.18262 11.751L2.18555 11.7109L2.16016 11.6807C1.17788 10.4793 0.599609 9.01196 0.599609 7.42676C0.599706 3.3916 4.34518 0.0996094 8.99512 0.0996094ZM8.99512 1.61426C4.81341 1.61426 1.99327 4.52213 1.99316 7.42676C1.99316 8.59359 2.41334 9.7147 3.19922 10.6699V10.6709C3.46514 11.0008 3.60073 11.4334 3.56934 11.8691C3.52359 12.505 3.38345 13.0888 3.2002 13.6064L3.11719 13.8389L3.33887 13.7295C3.9122 13.4445 4.38563 13.1266 4.66309 12.9082L4.66406 12.9072C5.06435 12.5903 5.58067 12.5146 6.04492 12.6943C6.93579 13.0416 7.934 13.2402 8.99512 13.2402C13.1768 13.2402 15.9971 10.3314 15.9971 7.42676C15.997 4.52215 13.1768 1.6143 8.99512 1.61426ZM5.27832 6.38477C5.53096 6.38477 5.77501 6.49269 5.95605 6.6875C6.13716 6.8825 6.2402 7.14815 6.24023 7.42676C6.24023 7.70554 6.13733 7.97193 5.95605 8.16699C5.77502 8.36173 5.53091 8.46973 5.27832 8.46973C5.02572 8.46969 4.7816 8.36177 4.60059 8.16699C4.41932 7.97194 4.31641 7.70554 4.31641 7.42676C4.31644 7.14821 4.41956 6.88249 4.60059 6.6875C4.7816 6.49272 5.02572 6.3848 5.27832 6.38477ZM8.99512 6.38477C9.24773 6.38479 9.49183 6.49271 9.67285 6.6875C9.85389 6.88249 9.95699 7.1482 9.95703 7.42676C9.95703 7.70554 9.85413 7.97193 9.67285 8.16699C9.49183 8.36178 9.24772 8.4697 8.99512 8.46973C8.74252 8.46973 8.49842 8.36174 8.31738 8.16699C8.1361 7.97193 8.0332 7.70554 8.0332 7.42676C8.03324 7.14815 8.13629 6.8825 8.31738 6.6875C8.49843 6.49269 8.74247 6.38477 8.99512 6.38477ZM12.7119 6.38477C12.9644 6.38486 13.2087 6.49277 13.3896 6.6875C13.5706 6.88248 13.6738 7.14825 13.6738 7.42676C13.6738 7.70549 13.5709 7.97194 13.3896 8.16699C13.2087 8.36172 12.9644 8.46964 12.7119 8.46973C12.4594 8.46973 12.2152 8.36167 12.0342 8.16699C11.8529 7.97193 11.75 7.70554 11.75 7.42676C11.75 7.1481 11.853 6.88251 12.0342 6.6875C12.2152 6.49269 12.4593 6.38477 12.7119 6.38477Z" 
                                          fill={contarComentariosPorEtapa(etapa.id) > 0 ? '#1777CF' : '#91929E'} 
                                          stroke="#FCFCFC" 
                                          strokeWidth={0.2}
                                        />
                                      </svg>
                                      <span 
                                        className={`text-xs font-medium min-w-[20px] text-center ${
                                          contarComentariosPorEtapa(etapa.id) > 0 ? 'text-[#1777CF]' : 'text-gray-400'
                                        }`}
                                      >
                                        {String(contarComentariosPorEtapa(etapa.id)).padStart(2, '0')}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                                {index < etapasFiltradasDropdown.length - 1 && (
                                  <div className="border-b border-gray-100 mx-[10px]"></div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500 mb-2">Nenhuma etapa encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 max-w-full relative" data-dropdown-fases>
                  <button
                    onClick={() => setDropdownFaseAberto(!dropdownFaseAberto)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm font-medium h-10 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                          <path d="M8.27 22.75H4.23c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v15.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-20c-1.27 0-1.48.34-1.48 1.35v15.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35zM19.77 15.75h-4.04c-2.01 0-2.98-.93-2.98-2.85V4.1c0-1.92.98-2.85 2.98-2.85h4.04c2.01 0 2.98.93 2.98 2.85v8.8c0 1.92-.98 2.85-2.98 2.85zm-4.04-13c-1.27 0-1.48.34-1.48 1.35v8.8c0 1.01.21 1.35 1.48 1.35h4.04c1.27 0 1.48-.34 1.48-1.35V4.1c0-1.01-.21-1.35-1.48-1.35z" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className="text-gray-900 truncate block min-w-0">
                        {faseSelecionada ? fasesUnicas.find(f => f.id === faseSelecionada)?.nome || 'Selecione uma fase' : 'Primeiro contato telefônico'}
                      </span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform flex-shrink-0 ml-1 ${dropdownFaseAberto ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownFaseAberto && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
                      <div className="p-[10px] border-b border-gray-100">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar fase..."
                            value={buscaFase}
                            onChange={(e) => setBuscaFase(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {fasesFiltradasDropdown.length > 0 ? (
                          fasesFiltradasDropdown.map((fase, index) => {
                            const numeroFormatado = String(fase.numero).padStart(2, '0');
                            return (
                              <div key={fase.id}>
                                <button
                                  onClick={() => selecionarFase(fase.id)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                    fase.id === faseSelecionada ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center justify-between min-w-0 flex-1">
                                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                                      <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded px-2 py-1 min-w-[24px] text-center flex-shrink-0">
                                        {numeroFormatado}
                                      </span>
                                      <span className="font-normal truncate text-[14px]">{fase.nome}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 ml-2">
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="14" 
                                        height="12" 
                                        viewBox="0 0 18 16" 
                                        fill="none"
                                        className="flex-shrink-0"
                                      >
                                        <path 
                                          d="M8.99512 0.0996094C13.6452 0.0996539 17.4003 3.39177 17.4004 7.42676C17.4004 11.462 13.6549 14.7539 9.00488 14.7539C7.78621 14.7539 6.63057 14.5272 5.58691 14.1211L5.5332 14.1006L5.48828 14.1357C5.09915 14.4418 4.45881 14.8631 3.70605 15.2168C3.20638 15.4502 2.64642 15.6613 2.06543 15.7842L2.06055 15.7852L1.99316 15.8008L1.9873 15.8018C1.84444 15.8297 1.701 15.8505 1.55664 15.8682L1.55371 15.8691L1.53516 15.8721C1.36865 15.8896 1.20216 15.9004 1.03711 15.9004C0.866682 15.9002 0.709052 15.7896 0.639648 15.6104C0.569959 15.4303 0.607251 15.2287 0.732422 15.0938L0.734375 15.0918C0.870133 14.9384 0.997313 14.77 1.11523 14.5996L1.11621 14.6006L1.11816 14.5977C1.17117 14.5157 1.22434 14.4336 1.27734 14.3516L1.28125 14.3457L1.29004 14.3271C1.34961 14.2309 1.40587 14.1345 1.45898 14.0381L1.45996 14.0391C1.79639 13.4381 2.11819 12.6449 2.18262 11.751L2.18555 11.7109L2.16016 11.6807C1.17788 10.4793 0.599609 9.01196 0.599609 7.42676C0.599706 3.3916 4.34518 0.0996094 8.99512 0.0996094ZM8.99512 1.61426C4.81341 1.61426 1.99327 4.52213 1.99316 7.42676C1.99316 8.59359 2.41334 9.7147 3.19922 10.6699V10.6709C3.46514 11.0008 3.60073 11.4334 3.56934 11.8691C3.52359 12.505 3.38345 13.0888 3.2002 13.6064L3.11719 13.8389L3.33887 13.7295C3.9122 13.4445 4.38563 13.1266 4.66309 12.9082L4.66406 12.9072C5.06435 12.5903 5.58067 12.5146 6.04492 12.6943C6.93579 13.0416 7.934 13.2402 8.99512 13.2402C13.1768 13.2402 15.9971 10.3314 15.9971 7.42676C15.997 4.52215 13.1768 1.6143 8.99512 1.61426ZM5.27832 6.38477C5.53096 6.38477 5.77501 6.49269 5.95605 6.6875C6.13716 6.8825 6.2402 7.14815 6.24023 7.42676C6.24023 7.70554 6.13733 7.97193 5.95605 8.16699C5.77502 8.36173 5.53091 8.46973 5.27832 8.46973C5.02572 8.46969 4.7816 8.36177 4.60059 8.16699C4.41932 7.97194 4.31641 7.70554 4.31641 7.42676C4.31644 7.14821 4.41956 6.88249 4.60059 6.6875C4.7816 6.49272 5.02572 6.3848 5.27832 6.38477ZM8.99512 6.38477C9.24773 6.38479 9.49183 6.49271 9.67285 6.6875C9.85389 6.88249 9.95699 7.1482 9.95703 7.42676C9.95703 7.70554 9.85413 7.97193 9.67285 8.16699C9.49183 8.36178 9.24772 8.4697 8.99512 8.46973C8.74252 8.46973 8.49842 8.36174 8.31738 8.16699C8.1361 7.97193 8.0332 7.70554 8.0332 7.42676C8.03324 7.14815 8.13629 6.8825 8.31738 6.6875C8.49843 6.49269 8.74247 6.38477 8.99512 6.38477ZM12.7119 6.38477C12.9644 6.38486 13.2087 6.49277 13.3896 6.6875C13.5706 6.88248 13.6738 7.14825 13.6738 7.42676C13.6738 7.70549 13.5709 7.97194 13.3896 8.16699C13.2087 8.36172 12.9644 8.46964 12.7119 8.46973C12.4594 8.46973 12.2152 8.36167 12.0342 8.16699C11.8529 7.97193 11.75 7.70554 11.75 7.42676C11.75 7.1481 11.853 6.88251 12.0342 6.6875C12.2152 6.49269 12.4593 6.38477 12.7119 6.38477Z" 
                                          fill={contarComentariosPorFase(fase.id) > 0 ? '#1777CF' : '#91929E'} 
                                          stroke="#FCFCFC" 
                                          strokeWidth={0.2}
                                        />
                                      </svg>
                                      <span 
                                        className={`text-xs font-medium min-w-[20px] text-center ${
                                          contarComentariosPorFase(fase.id) > 0 ? 'text-[#1777CF]' : 'text-gray-400'
                                        }`}
                                      >
                                        {String(contarComentariosPorFase(fase.id)).padStart(2, '0')}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                                {index < fasesFiltradasDropdown.length - 1 && (
                                  <div className="border-b border-gray-100 mx-[10px]"></div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-500 mb-2">Nenhuma fase encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}                
                </div>
                <button
                  onClick={voltarParaAtual}
                  className="bg-[#1777CF] hover:bg-[#1777CF]/90 text-white px-4 py-3 rounded-lg transition-colors font-medium text-sm h-10 flex items-center justify-center whitespace-nowrap min-w-[120px]"
                >
                  Fase Atual
                </button>
              </div>

              {/* Input de Comentário - Com Sistema Suspenso */}
              <div className="relative z-10">
                {/* Layout original sempre visível */}
                <div className="flex gap-3 bg-white p-3 rounded-lg shadow-lg border border-gray-200 absolute w-full" style={{ top: 0 }}>
                  <div className="flex-1">
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                      <textarea
					    ref={textareaRef}
                        value={novoComentario}
					     onInput={(e) => {
                         const target = e.target as HTMLTextAreaElement;
                         setNovoComentario(target.value);
						 
						// Auto-resize dinâmico SEM trocar textarea
                        target.style.height = 'auto';
                        const scrollHeight = target.scrollHeight;
                        const maxHeight = window.innerHeight - 300; // Limite da tela
                         
						 if (scrollHeight <= maxHeight) {
                         // Ainda tem espaço para expandir - sem scroll
                         target.style.height = scrollHeight + 'px';
                         target.style.overflowY = 'hidden';
                       } else {
                         // Atingiu altura máxima - ativar scroll
                         target.style.height = maxHeight + 'px';
                         target.style.overflowY = 'auto';
                       }
                       }}

                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), adicionarComentario())}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-300 resize-none bg-white scrollbar-thin"
                        placeholder="Adicionar comentário..."
                       style={{ 
                        height: '40px',
                        minHeight: '40px',
                       lineHeight: '20px',
                       overflowY: 'hidden'
                       }}

                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={adicionarComentario}
                      disabled={!novoComentario.trim()}
                      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors font-medium"
                    >
                      Enviar
                    </button>
                    {novoComentario.trim() && (
                      <button
                        onClick={cancelarComentario}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        Cancelar
                      </button>
                    )}


                </div>
				
            {/* Versão suspensa quando necessário */}
			    </div>
                
                {/* Spacer para manter espaço quando input expandir */}
                <div style={{ height: '80px' }}></div>
              </div>

            {/* Container dos Comentários */}
                       <div 
             className="bg-gray-100 py-[10px] border border-gray-200 rounded-xl overflow-hidden"
             style={{ 
               height: 'calc(100vh - 320px)', 
               minHeight: '400px',
               maxHeight: 'calc(100vh - 321px)' 
             }}
           >

			  <div id="comentarios-scroll-container" className="h-full overflow-y-auto overflow-x-hidden pl-[12px] pr-[15px]" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 #F7FAFC'
              }}>
                 <div className="h-full">
                  <div className="h-[calc(100%-20px)]">

                  <div className="space-y-3 pb-[3px]">
                  {comentariosAtual.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <MessageCircle size={48} className="text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium mb-2">Nenhum comentário encontrado</p>
                      <p className="text-gray-400 text-sm">Adicione o primeiro comentário usando o campo acima.</p>
                    </div>
                  ) : (
                    comentariosAtual.map((comentario) => (
                       <div key={comentario.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-0 max-w-full">
                        <div className="flex items-start space-x-3">
                          {comentario.responsavel.foto ? (
                            <img 
                              src={comentario.responsavel.foto} 
                              alt={comentario.responsavel.nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            gerarAvatar(comentario.responsavel.nome)
                          )}
                          <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium text-gray-900">{comentario.responsavel.nome}</h4>
                                <span className="text-xs text-gray-500">•</span>
                                <span className="text-xs text-gray-500">{comentario.data} às {comentario.hora}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                    onClick={() => {
                                    setEditandoId(comentario.id);
                                    setTextoEditando(comentario.texto);
                                  }}

                                  className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    version="1.1" 
                                    width="14" 
                                    height="14" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor"
                                  >
                                    <path d="M11 3.25H4c-.729 0-1.429.29-1.945.805A2.755 2.755 0 0 0 1.25 6v14c0 .729.29 1.429.805 1.945A2.755 2.755 0 0 0 4 22.75h14c.729 0 1.429-.29 1.945-.805A2.755 2.755 0 0 0 20.75 20v-8a.75.75 0 0 0-1.5 0v8A1.252 1.252 0 0 1 18 21.25H4A1.252 1.252 0 0 1 2.75 20V6A1.252 1.252 0 0 1 4 4.75h7a.75.75 0 0 0 0-1.5z" />
                                    <path d="M22.237 5.652a1.75 1.75 0 0 0 0-2.475l-1.414-1.414a1.75 1.75 0 0 0-2.475 0L8.095 12.016a.752.752 0 0 0-.215.447l-.353 3.182a.75.75 0 0 0 .828.828l3.182-.353a.752.752 0 0 0 .447-.215L22.237 5.652zm-1.06-1.061L11.11 14.658l-1.989.221.221-1.989L19.409 2.823a.252.252 0 0 1 .354 0l1.414 1.414a.252.252 0 0 1 0 .354z" />
                                    <path d="m16.227 4.945 2.828 2.828a.75.75 0 1 0 1.061-1.061l-2.828-2.828a.75.75 0 1 0-1.061 1.061z" />
                                  </svg>

                                </button>
                                <button
                                  onClick={() => excluirComentario(comentario.id)}
                                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            {editandoId === comentario.id ? (
                              <div className="flex gap-3">
                                <div className="flex-1">
                                  <textarea


                                  value={textoEditando}
                                  onChange={(e) => setTextoEditando(e.target.value)}

                                    onInput={(e) => {
                                    const target = e.target as HTMLTextAreaElement;
									const scrollContainer = document.getElementById('comentarios-scroll-container');
                                    const currentScroll = scrollContainer?.scrollTop || 0;
									
                                    target.style.height = 'auto';
                                    target.style.height = target.scrollHeight + 'px';	

                                    // Forçar scroll a voltar à posição original
                                    if (scrollContainer) {
                                      requestAnimationFrame(() => {
                                        scrollContainer.scrollTop = currentScroll;
                                      });
                                    }							
                                  }}
								    onFocus={(e) => {
                                    // Prevenir scroll ao focar
                                    const scrollContainer = document.getElementById('comentarios-scroll-container');
                                    const currentScroll = scrollContainer?.scrollTop || 0;
                                    e.target.scrollIntoView({ block: 'nearest' });
                                    if (scrollContainer) {
                                      scrollContainer.scrollTop = currentScroll;
                                    }
                                  }}

								    ref={(el) => {
                                    if (el && el.value) {
									  const scrollContainer = document.getElementById('comentarios-scroll-container');
                                      const currentScroll = scrollContainer?.scrollTop || 0;
                                      el.style.height = 'auto';
                                      el.style.height = el.scrollHeight + 'px';
									  
									  // Manter scroll após ajustar altura
                                      if (scrollContainer) {
                                        scrollContainer.scrollTop = currentScroll;
                                      }
                                    }
                                  }}

                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:outline-none focus:border-gray-300 focus:ring-0 text-sm resize-none overflow-hidden"                              
                                  style={{ minHeight: '40px', lineHeight: '20px' }}

                                  autoFocus
                                />
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => editarComentario(comentario.id, textoEditando)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    Salvar
                                  </button>

                                <button
                              
                                  onClick={() => {
                                    setEditandoId(null);
                                    setTextoEditando('');
                                  }}
                                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                                >
                                  Cancelar
                                </button>
								</div>
                              </div>
                            ) : (
                              <p className="text-gray-700 text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{comentario.texto}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  </div>
				   </div>
                </div>
              </div>
            </div>
          </div>
	     </div>
        </div>
      </div>

      {/* Estilos customizados */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Barra de rolagem moderna para comentários */
        .overflow-y-auto::-webkit-scrollbar {
          width: 8px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ModalComentarios;