import { useState, useEffect } from 'react';
import { X, Box, Scale, Truck, CheckCircle2, Minus, Plus, Sparkles } from 'lucide-react';
import { VIDRO, BOTAO_VERDE, BOTAO_VIDRO } from '@/components/checkout/estilos';
import { getHubUrl, getHeaders } from '@/components/utils/api';

// Ligado à Central Logística: a transportadora vem da regra de frete do cliente (Gestão de frete)
// ou da última entrega para ele; o peso estimado vem do cadastro dos produtos. Tudo pode ser trocado.
// O que for confirmado aqui vira o volume, o peso e a transportadora da expedição (e do romaneio).
const OUTRA = 'outra';
const kg = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 3 });

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
  const [transportadoraId, setTransportadoraId] = useState('');
  const [sugestao, setSugestao] = useState(null);

  // Toda vez que o modal abrir, ele reseta os campos para o padrão
  useEffect(() => {
    if (isOpen && pedido) {
      setVolumes(1);
      setEspecie('Caixa(s)');
      setPesoLiquido('');
      setPesoBruto('');
      setTransportadora('');
      setTransportadoraId('');
      setSugestao(null);
    }
  }, [isOpen, pedido]);

  // Pede à Central Logística a transportadora e o peso sugeridos para este pedido
  useEffect(() => {
    if (!isOpen || !pedido?.pedido_id) return;
    let ativo = true;
    const busca = new URLSearchParams({ pedido_id: pedido.pedido_id, ...(pedido.id ? { id_hub: pedido.id } : {}) });
    fetch(`${getHubUrl()}/api/hub/conferencia/logistica?${busca}`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((r) => {
        if (!ativo || !r?.success) return;
        setSugestao(r);
        if (r.transportadora) { setTransportadoraId(String(r.transportadora.id)); setTransportadora(r.transportadora.nome); }
        else if ((r.transportadoras || []).length) setTransportadoraId('');
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [isOpen, pedido?.pedido_id, pedido?.id]);

  if (!isOpen) return null;

  const qtdVolumes = Number(volumes) || 0;
  const lista = sugestao?.transportadoras || [];
  const temLista = lista.length > 0;
  const escolherTransportadora = (valor) => {
    setTransportadoraId(valor);
    if (valor === OUTRA || valor === '') { setTransportadora(''); return; }
    setTransportadora(lista.find((t) => String(t.id) === valor)?.nome || '');
  };

  const handleSalvar = () => {
    // Formata os pesos trocando vírgula por ponto (caso o usuário digite 1,5)
    onConfirm({
      volumes: Number(volumes) || 1,
      especie: especie || 'Caixa(s)',
      peso_liquido: Number(String(pesoLiquido).replace(',', '.')) || 0,
      peso_bruto: Number(String(pesoBruto).replace(',', '.')) || 0,
      transportadora: transportadora || 'Não informada',
      transportadora_id: transportadoraId && transportadoraId !== OUTRA ? Number(transportadoraId) : null
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
          {(sugestao?.peso_bruto || sugestao?.peso_liquido) && !pesoBruto && !pesoLiquido && (
            <button
              type="button"
              onClick={() => { if (sugestao.peso_liquido) setPesoLiquido(kg(sugestao.peso_liquido)); if (sugestao.peso_bruto) setPesoBruto(kg(sugestao.peso_bruto)); }}
              className="-mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-colors hover:bg-emerald-500/15"
            >
              <Sparkles size={13} /> Usar peso do cadastro: {sugestao.peso_bruto ? `${kg(sugestao.peso_bruto)} kg bruto` : `${kg(sugestao.peso_liquido)} kg líquido`}
            </button>
          )}

          <div>
            <label htmlFor="logistica-transportadora" className={ROTULO}>Transportadora ou motorista</label>
            {temLista && (
              <div className={`${CAMPO} mb-2`}>
                <Truck size={16} className="text-zinc-400 shrink-0" />
                <select
                  id="logistica-transportadora"
                  value={transportadoraId}
                  onChange={(e) => escolherTransportadora(e.target.value)}
                  className={`${ENTRADA} cursor-pointer dark:[color-scheme:dark]`}
                >
                  <option value="">Escolha a transportadora</option>
                  {lista.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  <option value={OUTRA}>Outra (digitar nome ou placa)</option>
                </select>
              </div>
            )}
            {(!temLista || transportadoraId === OUTRA) && (
              <div className={CAMPO}>
                <Truck size={16} className="text-zinc-400 shrink-0" />
                <input
                  id={temLista ? 'logistica-transportadora-texto' : 'logistica-transportadora'}
                  type="text"
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  placeholder="Nome da transportadora ou placa"
                  className={ENTRADA}
                />
              </div>
            )}
            {sugestao?.motivo && String(sugestao.transportadora?.id) === transportadoraId && (
              <p className="mt-1.5 ml-1 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400"><Sparkles size={12} />Sugerida: {sugestao.motivo}</p>
            )}
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
