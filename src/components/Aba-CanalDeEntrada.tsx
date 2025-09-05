import React, { useState } from 'react';
import { Plus, X, Calendar, MapPin, Users, Video, Star, MoreHorizontal } from 'lucide-react';

interface CanalEntrada {
  id: string;
  nome: string;
  tipo: 'redes-sociais' | 'streaming' | 'eventos' | 'outros';
  nomeEvento?: string;
  dataEvento?: string;
  localEvento?: string;
}

interface AbaCanalEntradaProps {
  canaisEntrada?: CanalEntrada[];
  onChange?: (canais: CanalEntrada[]) => void;
}

const AbaCanalEntrada: React.FC<AbaCanalEntradaProps> = ({ 
  canaisEntrada = [], 
  onChange 
}) => {
  const [canais, setCanais] = useState<CanalEntrada[]>(canaisEntrada);
  const [novoCanal, setNovoCanal] = useState<Partial<CanalEntrada>>({
    nome: '',
    tipo: 'redes-sociais'
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const tiposCanal = [
    { 
      value: 'redes-sociais', 
      label: 'Redes Sociais', 
      icon: Users,
      exemplos: ['Instagram', 'Facebook', 'LinkedIn', 'TikTok']
    },
    { 
      value: 'streaming', 
      label: 'Streaming', 
      icon: Video,
      exemplos: ['YouTube', 'Twitch', 'Netflix', 'Prime Video']
    },
    { 
      value: 'eventos', 
      label: 'Eventos', 
      icon: Calendar,
      exemplos: ['Feira', 'Workshop', 'Palestra', 'Networking']
    },
    { 
      value: 'outros', 
      label: 'Outros', 
      icon: MoreHorizontal,
      exemplos: ['Website', 'Email', 'Indicação', 'Outdoors']
    }
  ];

  const adicionarCanal = () => {
    if (!novoCanal.nome || !novoCanal.tipo) return;

    const canal: CanalEntrada = {
      id: Date.now().toString(),
      nome: novoCanal.nome,
      tipo: novoCanal.tipo as CanalEntrada['tipo'],
      ...(novoCanal.tipo === 'eventos' && {
        nomeEvento: novoCanal.nomeEvento || '',
        dataEvento: novoCanal.dataEvento || '',
        localEvento: novoCanal.localEvento || ''
      })
    };

    const novosCanais = [...canais, canal];
    setCanais(novosCanais);
    onChange?.(novosCanais);
    
    setNovoCanal({ nome: '', tipo: 'redes-sociais' });
    setMostrarFormulario(false);
  };

  const removerCanal = (id: string) => {
    const novosCanais = canais.filter(canal => canal.id !== id);
    setCanais(novosCanais);
    onChange?.(novosCanais);
  };

  const getIconoTipo = (tipo: CanalEntrada['tipo']) => {
    const tipoInfo = tiposCanal.find(t => t.value === tipo);
    return tipoInfo?.icon || MoreHorizontal;
  };

  const canaisPorTipo = tiposCanal.map(tipo => ({
    ...tipo,
    canais: canais.filter(canal => canal.tipo === tipo.value)
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Canal de Entrada
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os canais pelos quais os clientes chegam até você
          </p>
        </div>
        
        <button
          onClick={() => setMostrarFormulario(true)}
          className="flex items-center gap-2 bg-[#1777CF] text-white px-4 py-2 rounded-lg hover:bg-[#1565C0] transition-colors duration-200 font-medium"
        >
          <Plus size={16} />
          Adicionar Canal
        </button>
      </div>

      {/* Formulário de Novo Canal */}
      {mostrarFormulario && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Novo Canal de Entrada</h4>
            <button
              onClick={() => setMostrarFormulario(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Canal *
              </label>
              <select
                value={novoCanal.tipo}
                onChange={(e) => setNovoCanal({ 
                  ...novoCanal, 
                  tipo: e.target.value as CanalEntrada['tipo']
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none transition-colors"
              >
                {tiposCanal.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Canal *
              </label>
              <input
                type="text"
                value={novoCanal.nome}
                onChange={(e) => setNovoCanal({ ...novoCanal, nome: e.target.value })}
                placeholder="Ex: Instagram, YouTube, Feira Tech..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Campos adicionais para eventos */}
          {novoCanal.tipo === 'eventos' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-800">Detalhes do Evento</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Evento
                  </label>
                  <input
                    type="text"
                    value={novoCanal.nomeEvento || ''}
                    onChange={(e) => setNovoCanal({ 
                      ...novoCanal, 
                      nomeEvento: e.target.value 
                    })}
                    placeholder="Ex: Tech Summit 2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Evento
                  </label>
                  <input
                    type="date"
                    value={novoCanal.dataEvento || ''}
                    onChange={(e) => setNovoCanal({ 
                      ...novoCanal, 
                      dataEvento: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Local/Cidade
                  </label>
                  <input
                    type="text"
                    value={novoCanal.localEvento || ''}
                    onChange={(e) => setNovoCanal({ 
                      ...novoCanal, 
                      localEvento: e.target.value 
                    })}
                    placeholder="Ex: São Paulo - SP"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1777CF] focus:border-[#1777CF] outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setMostrarFormulario(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={adicionarCanal}
              disabled={!novoCanal.nome || !novoCanal.tipo}
              className="px-4 py-2 bg-[#1777CF] text-white rounded-lg hover:bg-[#1565C0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Canais por Tipo */}
      <div className="space-y-6">
        {canaisPorTipo.map(({ value, label, icon: Icon, canais: canaisTipo, exemplos }) => (
          <div key={value} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-[#1777CF]/10 rounded-lg">
                <Icon size={16} className="text-[#1777CF]" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{label}</h4>
                <p className="text-xs text-gray-500">
                  Exemplos: {exemplos.join(', ')}
                </p>
              </div>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                {canaisTipo.length} canal{canaisTipo.length !== 1 ? 's' : ''}
              </span>
            </div>

            {canaisTipo.length > 0 && (
              <div className="ml-11 space-y-2">
                {canaisTipo.map(canal => (
                  <div
                    key={canal.id}
                    className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 hover:border-[#1777CF]/30 transition-colors duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{canal.nome}</span>
                        {canal.tipo === 'eventos' && canal.nomeEvento && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {canal.nomeEvento}
                          </span>
                        )}
                      </div>
                      
                      {canal.tipo === 'eventos' && (canal.dataEvento || canal.localEvento) && (
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          {canal.dataEvento && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(canal.dataEvento).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {canal.localEvento && (
                            <div className="flex items-center gap-1">
                              <MapPin size={12} />
                              {canal.localEvento}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => removerCanal(canal.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1"
                      title="Remover canal"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {canaisTipo.length === 0 && (
              <div className="ml-11 text-sm text-gray-400 italic">
                Nenhum canal adicionado ainda
              </div>
            )}
          </div>
        ))}
      </div>

      {canais.length === 0 && !mostrarFormulario && (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4">
            <Star size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum canal cadastrado
          </h3>
          <p className="text-gray-500 mb-4">
            Adicione canais de entrada para rastrear de onde vêm seus clientes
          </p>
          <button
            onClick={() => setMostrarFormulario(true)}
            className="bg-[#1777CF] text-white px-4 py-2 rounded-lg hover:bg-[#1565C0] transition-colors duration-200"
          >
            Adicionar Primeiro Canal
          </button>
        </div>
      )}
    </div>
  );
};

export default AbaCanalEntrada;