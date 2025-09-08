import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (nome: string) => void;
}

export function AddEmpresaModal({ open, onClose, onCreate }: Props) {
  const [nome, setNome] = useState("");
  
  const handleCreate = () => {
    if (nome.trim()) {
      onCreate(nome.trim());
      setNome("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreate();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Adicionar Empresa</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome da Empresa *
            </label>
            <Input 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex.: ACME LTDA"
              className="w-full"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!nome.trim()}
            className="bg-[#1777CF] hover:bg-[#1565C0] text-white"
          >
            Criar
          </Button>
        </div>
      </div>
    </div>
  );
}