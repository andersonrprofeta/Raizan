import { useState, useEffect } from 'react';
import { X, Box, Scale, Truck, CheckCircle2, Minus, Plus } from 'lucide-react';
import { VIDRO, BOTAO_VERDE, BOTAO_VIDRO } from '@/components/checkout/estilos';

const ROTULO = "block text-[13px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1";
const CAMPO =
  "flex items-center gap-2.5 h-12 px-4 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] " +
  "focus-within:ring-2 focus-within:ring-emerald-500/40 transition-shadow duration-300";
const ENTRADA = "w-full min-w-0 bg-transparent text-[15px] font-semibold outline-none placeholder:font-medium placeholder:text-zinc-400";
const BOTAO_PASSO =
  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-white/[0.1] " +
  "text-zinc-700 dark:text-zinc-200 shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-all duration-300 active:scale-90 disabled:opacity-40";

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

  const qtdVolumes = Number(volumes) || 0;

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/70 backdrop-blur-md">
      <div
        className={`${VIDRO} !bg-white/95 dark:!bg-[#121214]/95 w-full max-w-lg overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-5 flex justify-between items-start gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Box size={22} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight">Dados de logística</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                Pedido #{pedido?.pedido_id} · {pedido?.billing?.first_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.13] flex items-center justify-center text-zinc-500 shrink-0 transition-all duration-300 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="logistica-volumes" className={ROTULO}>Volumes</label>
              <div className={`${CAMPO} !px-1.5 justify-between`}>
                <button type="button" title="Menos um volume" disabled={qtdVolumes <= 1} onClick={() => setVolumes(Math.max(1, qtdVolumes - 1))} className={BOTAO_PASSO}>
                  <Minus size={16} />
                </button>
                <input
                  id="logistica-volumes"
                  type="number"
                  min="1"
                  value={volumes}
                  onChange={(e) => setVolumes(e.target.value)}
                  className={`${ENTRADA} text-center text-lg font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                />
                <button type="button" title="Mais um volume" onClick={() => setVolumes(qtdVolumes + 1)} className={BOTAO_PASSO}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="logistica-especie" className={ROTULO}>Espécie</label>
              <div className={CAMPO}>
                <input
                  id="logistica-especie"
                  type="text"
                  value={especie}
                  onChange={(e) => setEspecie(e.target.value)}
                  placeholder="Caixa, fardo..."
                  className={ENTRADA}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="logistica-peso-liquido" className={ROTULO}>Peso líquido</label>
              <div className={CAMPO}>
                <Scale size={16} className="text-zinc-400 shrink-0" />
                <input
                  id="logistica-peso-liquido"
                  type="text"
                  inputMode="decimal"
                  value={pesoLiquido}
                  onChange={(e) => setPesoLiquido(e.target.value)}
                  placeholder="0,000"
                  className={ENTRADA}
                />
                <span className="text-xs font-semibold text-zinc-400">kg</span>
              </div>
            </div>
            <div>
              <label htmlFor="logistica-peso-bruto" className={ROTULO}>Peso bruto</label>
              <div className={CAMPO}>
                <Scale size={16} className="text-zinc-400 shrink-0" />
                <input
                  id="logistica-peso-bruto"
                  type="text"
                  inputMode="decimal"
                  value={pesoBruto}
                  onChange={(e) => setPesoBruto(e.target.value)}
                  placeholder="0,000"
                  className={ENTRADA}
                />
                <span className="text-xs font-semibold text-zinc-400">kg</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="logistica-transportadora" className={ROTULO}>Transportadora ou motorista</label>
            <div className={CAMPO}>
              <Truck size={16} className="text-zinc-400 shrink-0" />
              <input
                id="logistica-transportadora"
                type="text"
                value={transportadora}
                onChange={(e) => setTransportadora(e.target.value)}
                placeholder="Nome da transportadora ou placa"
                className={ENTRADA}
              />
            </div>
          </div>
        </div>

        <div className="p-6 flex justify-end gap-2.5">
          <button onClick={onClose} className={`${BOTAO_VIDRO} h-11 px-5 text-sm`}>
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={qtdVolumes < 1}
            className={`${BOTAO_VERDE} h-11 px-6 text-sm disabled:opacity-50`}
          >
            <CheckCircle2 size={18} /> Confirmar e faturar
          </button>
        </div>
      </div>
    </div>
  );
}
