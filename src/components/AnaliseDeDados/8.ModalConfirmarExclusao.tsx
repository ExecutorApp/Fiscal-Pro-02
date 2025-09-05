import React from 'react';
import { Trash2 } from 'lucide-react';

interface ModalConfirmarExclusaoProps {
  isOpen: boolean;
  itemToDelete: { id: string; name: string } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ModalConfirmarExclusao: React.FC<ModalConfirmarExclusaoProps> = ({
  isOpen,
  itemToDelete,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !itemToDelete) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
      <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-100 transform scale-100 opacity-100 transition-all duration-300">
        <div className="text-center">
          {/* Ícone de Aviso */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <Trash2 size={24} className="text-red-500" />
            </div>
          </div>
          
          {/* Título */}
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Confirmar Exclusão
          </h3>
          
          {/* Mensagem */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            Tem certeza de que deseja excluir o arquivo{' '}
            <span className="font-semibold text-gray-900">"{itemToDelete.name}"</span>?
            <br />
            <span className="text-sm text-red-500 mt-2 block">
              Esta ação não pode ser desfeita.
            </span>
          </p>
          
          {/* Botões */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-semibold min-w-[120px] border border-gray-300"
            >
              Cancelar 
            </button>
            <button
              onClick={onConfirm}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 font-semibold min-w-[120px] shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Excluir
            </button> 
          </div>
        </div>  
      </div>  
    </div> 
  );
};

export default ModalConfirmarExclusao;