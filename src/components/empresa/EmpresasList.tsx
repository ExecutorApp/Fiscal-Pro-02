import React, { useState } from "react";
import { Empresa } from "./types";
import { Edit2, Trash2 } from "lucide-react";
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

  return (
    <>
      <div className="w-[30%] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Empresas</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}>
          {empresas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-sm">Nenhuma empresa cadastrada</p>
              <p className="text-xs text-gray-400 mt-1">Clique em "Adicionar Empresa" para começar</p>
            </div>
          ) : (
            <div className="p-2">
              {empresas.map((empresa, index) => (
                <div
                  key={empresa.id}
                  className={`
                    p-3 mb-2 rounded-lg border cursor-pointer transition-all duration-200
                    ${selecionadaId === empresa.id 
                      ? 'border-[#1777CF] bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => !editandoId && onSelecionar(empresa.id)}
                >
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
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p 
                          className="font-medium text-gray-900 truncate"
                          title={empresa.nome}
                        >
                          {empresa.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          Empresa {index + 1}
                        </p>
                      </div>
                      
                      <div className="flex gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => iniciarEdicao(empresa)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors"
                          title="Editar nome"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => confirmarRemocao(empresa.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                          title="Remover empresa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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