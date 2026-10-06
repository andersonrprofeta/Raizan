import { useState, useEffect } from 'react';
import { X, Box, Scale, Truck, CheckCircle2 } from 'lucide-react';

export default function ManipulaDados({ isOpen, onClose, onConfirm, pedido }) {
  const [volumes, setVolumes] = useState(1);
  const [especie, setEspecie] = useState('Caixa(s)');
  const [pesoLiquido, setPesoLiquido] = useState('');
  const [pesoBruto, setPesoBruto] = useState('');
  const [transportadora, setTransportadora] = useState('');

  // Toda vez que o modal abrir, ele reseta os campos para o padrão
  useEffect(() => {
    if (isOpen && pedido) {
      setVolumes(1);
      setEspecie('Caixa(s)');
      setPesoLiquido('');
      setPesoBruto('');
      setTransportadora('');
    }
  }, [isOpen, pedido]);

  if (!isOpen) return null;

  const handleSalvar = () => {
    // Formata os pesos trocando vírgula por ponto (caso o usuário digite 1,5)
    onConfirm({
      volumes: Number(volumes) || 1,
      especie: especie || 'Caixa(s)',
      peso_liquido: Number(String(pesoLiquido).replace(',', '.')) || 0,
      peso_bruto: Number(String(pesoBruto).replace(',', '.')) || 0,
      transportadora: transportadora || 'Não informada'
    });
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-zinc-950 p-5 flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Box size={20} className="text-emerald-400" /> Dados de Logística
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-medium">
              Pedido #{pedido?.pedido_id} • Cliente: {pedido?.billing?.first_name}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Qtd. Volumes</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Box size={16} />
                </div>
                <input 
                  type="number" 
                  value={volumes}
                  onChange={(e) => setVolumes(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Espécie</label>
              <input 
                type="text" 
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                placeholder="Ex: Caixa, Fardo..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-3 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Peso Líquido (KG)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Scale size={16} />
                </div>
                <input 
                  type="text" 
                  value={pesoLiquido}
                  onChange={(e) => setPesoLiquido(e.target.value)}
                  placeholder="0.000"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Peso Bruto (KG)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Scale size={16} />
                </div>
                <input 
                  type="text" 
                  value={pesoBruto}
                  onChange={(e) => setPesoBruto(e.target.value)}
                  placeholder="0.000"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wide">Transportadora / Motorista</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Truck size={16} />
              </div>
              <input 
                type="text" 
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                placeholder="Nome da transportadora ou placa..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-9 pr-3 text-sm font-bold text-zinc-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSalvar}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <CheckCircle2 size={18} /> Confirmar e Faturar
          </button>
        </div>

      </div>
    </div>
  );
}