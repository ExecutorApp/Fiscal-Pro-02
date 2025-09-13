import React, { useState, useEffect } from "react";

interface RenameModalProps {
  isOpen: boolean;
  currentName?: string;
  onClose: () => void;
  onSave: (newName: string) => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, currentName = "", onClose, onSave }) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold mb-2">Renomear arquivo</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-0,5 focus:ring-[#1777CF] focus:border-[#1777CF]"
          placeholder="Novo nome"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-[25px] py-2 rounded border">Cancelar</button>
          <button onClick={() => onSave(name)} className="px-[25px] py-2 rounded bg-[#1777CF] text-white">Salvar</button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;