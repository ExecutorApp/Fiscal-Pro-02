import React, { useState, useEffect } from "react";
import { Empresa } from "./types";
import { Edit2, Trash2, MoreVertical } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface EmpresasListProps {
  empresas: Empresa[];
  selecionadaId: string | null;
  onSelecionar: (id: string) => void;
  onRenomear: (id: string, nome: string) => void;
  onRemover: (id: string) => void;
}

export function EmpresasList({ 
  empresas, 
  selecionadaId, 
  onSelecionar, 
  onRenomear, 
  onRemover 
}: EmpresasListProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);
  const [dropdownAberto, setDropdownAberto] = useState<string | null>(null);

  const iniciarEdicao = (empresa: Empresa) => {
    setEditandoId(empresa.id);
    setNovoNome(empresa.nome);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setNovoNome("");
  };

  const salvarEdicao = () => {
    if (editandoId && novoNome.trim()) {
      onRenomear(editandoId, novoNome.trim());
      setEditandoId(null);
      setNovoNome("");
    }
  };

  const confirmarRemocao = (id: string) => {
    setConfirmandoId(id);
  };

  const cancelarRemocao = () => {
    setConfirmandoId(null);
  };

  const executarRemocao = () => {
    if (confirmandoId) {
      onRemover(confirmandoId);
      setConfirmandoId(null);
    }
  };

  const empresaParaConfirmar = empresas.find(e => e.id === confirmandoId);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setDropdownAberto(null);
    };

    if (dropdownAberto) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [dropdownAberto]);

  return (
    <>
      <div className="w-full h-full bg-[#FCFCFC] rounded-xl border border-gray-200 flex flex-col">
        {/* Header com Títulos e Ações */}
         <div className="flex justify-between items-center px-0 py-[14px] border-b border-[#D8E0F0]">
           <div className="flex-1">
             <h3 className="text-sm font-medium text-[#272B30] text-left pl-4">Títulos</h3>
           </div>
           <div className="flex-1">
             <h3 className="text-sm font-medium text-[#272B30] text-right pr-4">Ações</h3>
           </div>
         </div>
        
        <div className="flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
          {empresas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-sm">Nenhuma empresa cadastrada</p>
              <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Empresa" para começar</p>
            </div>
          ) : (
            <div className="px-0">
              {empresas.map((empresa, index) => (
                <React.Fragment key={empresa.id}>
                  {/* Linha separadora */}
                  {index > 0 && (
                    <div className="py-0 mx-[15px]">
                      <div className="h-px bg-[#D8E0F0] opacity-60"></div>
                    </div>
                  )}
                  
                  {/* Item da empresa */}
                  <div className="py-1 mx-[5px]">
                    {editandoId === empresa.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={novoNome}
                          onChange={(e) => setNovoNome(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") salvarEdicao();
                            if (e.key === "Escape") cancelarEdicao();
                          }}
                          className="text-sm h-8"
                          autoFocus
                        />
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicao}
                            className="h-6 px-2 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={salvarEdicao}
                            disabled={!novoNome.trim()}
                            className="h-6 px-2 text-xs bg-[#1777CF] hover:bg-[#1565C0]"
                          >
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div 
                          className="flex items-center gap-2 px-3 py-3 rounded-[14px] cursor-pointer transition-all duration-200 hover:bg-gray-50"
                          onClick={() => onSelecionar(empresa.id)}
                        >
                        {/* Numeração */}
                         <div className="flex items-center gap-2 flex-1 min-w-0">
                           <div className="flex items-center gap-2 flex-shrink-0">
                             <span className={`text-base font-medium w-5 text-center ${
                               selecionadaId === empresa.id ? 'text-[#1777CF]' : 'text-[#6B7280]'
                             }`}>
                               {String(index + 1).padStart(2, '0')}
                             </span>
                             <div className="w-px h-5 bg-[#D8E0F0]"></div>
                           </div>
                           
                           {/* Nome da empresa */}
                           <div className="flex-1 min-w-0">
                             <p 
                               className={`text-base font-normal truncate ${
                                 selecionadaId === empresa.id ? 'text-[#1777CF]' : 'text-[#000000]'
                               }`}
                               title={empresa.nome}
                             >
                               {empresa.nome}
                             </p>
                           </div>
                         </div>
                        
                        {/* Ícones de ação */}
                          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                           <button
                             onClick={() => setDropdownAberto(dropdownAberto === empresa.id ? null : empresa.id)}
                             className="w-9 h-9 flex items-center justify-center bg-[#F4F4F4] rounded-lg hover:bg-gray-300 transition-colors"
                             title="Mais opções"
                           >
                             <svg xmlns="http://www.w3.org/2000/svg" width="3,5" height="18" viewBox="0 0 4 18" fill="none">
                               <path d="M4 2C4 3.10457 3.10457 4 2 4C0.895431 4 0 3.10457 0 2C0 0.895431 0.895431 0 2 0C3.10457 0 4 0.895431 4 2Z" fill="#3A3F51"/>
                               <path d="M4 9C4 10.1046 3.10457 11 2 11C0.895431 11 0 10.1046 0 9C0 7.89543 0.895431 7 2 7C3.10457 7 4 7.89543 4 9Z" fill="#3A3F51"/>
                               <path d="M2 18C3.10457 18 4 17.1046 4 16C4 14.8954 3.10457 14 2 14C0.895431 14 0 14.8954 0 16C0 17.1046 0.895431 18 2 18Z" fill="#3A3F51"/>
                             </svg>
                           </button>
                           
                           {/* Dropdown */}
                           {dropdownAberto === empresa.id && (
                             <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                               <button
                                 onClick={() => {
                                   iniciarEdicao(empresa);
                                   setDropdownAberto(null);
                                 }}
                                 className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 first:rounded-t-lg"
                               >
                                 <Edit2 size={14} className="text-gray-600" />
                                 Editar
                               </button>
                               <button
                                 onClick={() => {
                                   confirmarRemocao(empresa.id);
                                   setDropdownAberto(null);
                                 }}
                                 className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600 hover:bg-red-50 last:rounded-b-lg"
                               >
                                 <Trash2 size={14} className="text-red-600" />
                                 Excluir
                               </button>
                             </div>
                           )}
                         </div>
                      </div>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação */}
      {confirmandoId && empresaParaConfirmar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 size={24} className="text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Confirmar Remoção
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Tem certeza que deseja remover a empresa <strong>"{empresaParaConfirmar.nome}"</strong>?
            </p>
            
            <p className="text-sm text-red-600 text-center mb-6">
              Esta ação não pode ser desfeita e todos os dados serão perdidos.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelarRemocao}
              >
                Cancelar
              </Button>
              <Button
                onClick={executarRemocao}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmar Remoção
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}