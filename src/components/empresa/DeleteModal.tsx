import React from "react";

interface DeleteModalProps {
  isOpen: boolean;
  message?: string;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, message = "Tem certeza que deseja excluir este item?", onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm rounded-lg shadow-lg p-4">
        <div className="text-lg font-semibold mb-2">Excluir</div>
        <div className="text-sm text-gray-700 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-[25px] py-2 rounded border">Cancelar</button>
          <button onClick={onConfirm} className="px-[25px] py-2 rounded bg-red-600 text-white">Excluir</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;