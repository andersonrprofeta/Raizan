"use client";

// Conferência cega de mercadorias. O conferente nunca vê a quantidade pedida:
// bipa ou digita o que chegou e só no fim o Raizan diz o que bateu.
// Feita para leitor de código (manda Enter no fim), tablet e coletor industrial.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, ArrowLeft, Barcode, CheckCircle2, ChevronRight, ClipboardCheck, Loader2, Minus, PackageX, Plus, Printer, ScanLine, Search, XCircle } from "lucide-react";
import { api, BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Carregando, CascaPagina, EstadoVazio, Modal, VIDRO } from "@/components/vendedores/ui";
import { ChipStatus, diaCurto, quantidade } from "@/components/compras/ui";
import { montarMapaDeConferencia } from "@/components/compras/MapaEntradas";
import { abrirDocumento } from "@/components/utils/documentoPdf";
import { getTenantId } from "@/components/utils/api";
import { agoraEmBrasilia } from "@/components/utils/horaBrasilia";

const chaveDoRascunho = (id) => `@raizan:conferencia-compra:${getTenantId()}:${id}`;
const LIMITE_POR_BIPE = 100000;

// "12*7891000000017" conta 12 de uma vez (caixa fechada)
function lerBipe(texto) {
  const limpo = String(texto || "").trim();
  const multiplicado = limpo.match(/^(\d+(?:[.,]\d+)?)\s*[*xX]\s*(.+)$/);
  if (multiplicado) return { quantidade: Number(multiplicado[1].replace(",", ".")), codigo: multiplicado[2].trim() };
  return { quantidade: 1, codigo: limpo };
}

const normalizar = (codigo) => String(codigo || "").trim().toUpperCase();

// Bipe curto e discreto: agudo quando achou, grave quando não reconheceu
let audio = null;
function tocar(certo) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const oscilador = audio.createOscillator();
    const volume = audio.createGain();
    oscilador.frequency.value = certo ? 1320 : 220;
    volume.gain.setValueAtTime(0.08, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + (certo ? 0.09 : 0.28));
    oscilador.connect(volume).connect(audio.destination);
    oscilador.start();
    oscilador.stop(audio.currentTime + (certo ? 0.1 : 0.3));
  } catch (erro) { /* sem som não impede a conferência */ }
}

// ==========================================
// FILA: o que chegou ou está para chegar
// ==========================================
function Fila() {
  const router = useRouter();
  const [compras, setCompras] = useState(null);
  const [busca, setBusca] = useState("");
  const campo = useRef(null);

  useEffect(() => {
    api("/compras/conferencia/fila").then((resposta) => {
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível carregar a fila."); setCompras([]); return; }
      setCompras(resposta.compras);
    }).catch(() => { toast.error("Sem conexão com o servidor."); setCompras([]); });
    campo.current?.focus();
  }, []);

  const filtradas = useMemo(() => {
    const termo = normalizar(busca);
    if (!termo || !compras) return compras || [];
    return compras.filter((c) => normalizar(c.pedido_compra).includes(termo) || normalizar(c.fornecedor_nome).includes(termo));
  }, [compras, busca]);

  // Bipar o número do pedido abre direto
  const aoConfirmar = (evento) => {
    evento.preventDefault();
    const exato = (compras || []).find((c) => normalizar(c.pedido_compra) === normalizar(busca));
    const unico = filtradas.length === 1 ? filtradas[0] : null;
    const escolhida = exato || unico;
    if (escolhida) router.push(`/compras/conferencia/?id=${escolhida.id}`);
    else if (busca) toast.error("Nenhum pedido com esse número na fila.");
  };

  return (
    <CascaPagina>
      <header>
        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Recebimento</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">Conferência cega</h1>
        <p className="text-zinc-500 mt-1">Escolha o pedido ou bipe o número dele.</p>
      </header>

      <form onSubmit={aoConfirmar} className="relative">
        <ScanLine size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" />
        <input ref={campo} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Número do pedido ou fornecedor" aria-label="Buscar pedido de compra" className={`${CAMPO} h-14 pl-14 text-base rounded-[20px]`} />
      </form>

      <section className={`${VIDRO} overflow-hidden`}>
        {compras === null ? <Carregando texto="Carregando fila..." /> : filtradas.length === 0 ? (
          <EstadoVazio icone={ClipboardCheck} titulo={busca ? "Nada encontrado" : "Nada para conferir"} texto={busca ? "Confira o número do pedido." : "Quando um pedido de compra chegar, ele aparece aqui."} />
        ) : (
          <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
            {filtradas.map((compra) => (
              <li key={compra.id}>
                <Link href={`/compras/conferencia/?id=${compra.id}`} className="group flex items-center gap-4 px-5 sm:px-6 min-h-[76px] py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] active:bg-purple-500/[0.06] transition-colors">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center"><Barcode size={20} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold tracking-tight text-zinc-900 dark:text-white">Pedido {compra.pedido_compra}</p>
                    <p className="text-sm text-zinc-500 truncate">{compra.fornecedor_nome || "Fornecedor não informado"} · {compra.total_itens} {compra.total_itens === 1 ? "item" : "itens"}{compra.data_prevista ? ` · previsto ${diaCurto(compra.data_prevista)}` : ""}</p>
                  </div>
                  <span className="hidden sm:block"><ChipStatus status={compra.status_recebimento} /></span>
                  <ChevronRight size={20} className="text-zinc-300 group-hover:text-purple-500 transition-colors" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CascaPagina>
  );
}

// ==========================================
// CONTAGEM DE UM PEDIDO
// ==========================================
function ItemContado({ item, contado, destaque, resultado, onMudar }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");

  const situacao = resultado?.situacao;
  const cor = situacao === "ok"
    ? "border-emerald-500/30 bg-emerald-500/[0.06]"
    : situacao
      ? "border-rose-500/30 bg-rose-500/[0.06]"
      : contado > 0
        ? "border-purple-500/25 bg-purple-500/[0.05]"
        : "border-black/[0.06] dark:border-white/[0.07] bg-white/60 dark:bg-white/[0.02]";

  const salvar = () => {
    const valor = Number(String(texto).replace(",", "."));
    if (Number.isFinite(valor) && valor >= 0 && valor <= LIMITE_POR_BIPE) onMudar(valor);
    setEditando(false);
  };

  return (
    <li id={`item-${item.id}`} className={`flex items-center gap-3 sm:gap-4 rounded-[22px] border px-4 sm:px-5 py-3.5 transition-all duration-300 ${cor} ${destaque ? "ring-2 ring-purple-500 scale-[1.01]" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-900 dark:text-white leading-snug">{item.descricao}</p>
        <p className="text-xs font-mono text-zinc-500 mt-0.5 truncate">{[item.sku, item.ean].filter(Boolean).join(" · ") || "Sem código"}{item.unidade_medida ? ` · ${item.unidade_medida}` : ""}</p>
        {situacao && (
          <p className={`text-xs font-semibold mt-1 ${situacao === "ok" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
            {situacao === "ok" ? "Bateu com o pedido" : resultado.diferenca !== undefined ? `${resultado.diferenca > 0 ? "Sobrou" : "Faltou"} ${quantidade(Math.abs(resultado.diferenca))}` : "Não bateu com o pedido"}
          </p>
        )}
      </div>

      {resultado ? (
        situacao === "ok" ? <CheckCircle2 size={26} className="text-emerald-500 shrink-0" /> : <XCircle size={26} className="text-rose-500 shrink-0" />
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" aria-label={`Tirar um de ${item.descricao}`} onClick={() => onMudar(Math.max(0, contado - 1))} disabled={contado <= 0} className="w-11 h-11 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.07] text-zinc-600 dark:text-zinc-300 active:scale-90 transition-all disabled:opacity-30"><Minus size={18} /></button>
          {editando ? (
            <input
              autoFocus
              inputMode="decimal"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onBlur={salvar}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); salvar(); } if (e.key === "Escape") setEditando(false); }}
              aria-label={`Quantidade de ${item.descricao}`}
              className="w-20 h-11 rounded-2xl text-center text-lg font-semibold tabular-nums bg-white dark:bg-white/[0.08] border border-purple-500/50 outline-none"
            />
          ) : (
            <button type="button" onClick={() => { setTexto(contado ? String(contado) : ""); setEditando(true); }} aria-label={`Digitar quantidade de ${item.descricao}`} className={`min-w-[64px] h-11 px-2 rounded-2xl text-xl font-semibold tabular-nums transition-colors ${contado > 0 ? "text-purple-700 dark:text-purple-300" : "text-zinc-300 dark:text-zinc-600"}`}>
              {quantidade(contado)}
            </button>
          )}
          <button type="button" aria-label={`Somar um de ${item.descricao}`} onClick={() => onMudar(contado + 1)} className="w-11 h-11 rounded-full flex items-center justify-center bg-purple-600 text-white shadow-[0_6px_14px_-6px_rgba(124,58,237,0.8)] active:scale-90 transition-all"><Plus size={18} /></button>
        </div>
      )}
    </li>
  );
}

function Contagem({ id }) {
  const router = useRouter();
  const [compra, setCompra] = useState(null);
  const [itens, setItens] = useState([]);
  const [contagem, setContagem] = useState({});
  const [extras, setExtras] = useState({});
  const [inicio, setInicio] = useState(null);
  const [bipe, setBipe] = useState("");
  const [destaque, setDestaque] = useState(null);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const campo = useRef(null);
  const carregou = useRef(false);

  useEffect(() => {
    api(`/compras/${id}/conferencia`).then((resposta) => {
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível abrir a conferência."); router.replace("/compras/conferencia/"); return; }
      setCompra(resposta.compra);
      setItens(resposta.itens);
      // Rascunho: queda de energia ou troca de tela não perdem a contagem
      try {
        const salvo = JSON.parse(localStorage.getItem(chaveDoRascunho(id)) || "null");
        if (salvo) { setContagem(salvo.contagem || {}); setExtras(salvo.extras || {}); setInicio(salvo.inicio || agoraEmBrasilia()); }
        else setInicio(agoraEmBrasilia());
      } catch (erro) { setInicio(agoraEmBrasilia()); }
      carregou.current = true;
    }).catch(() => toast.error("Sem conexão com o servidor."));
  }, [id, router]);

  useEffect(() => {
    if (!carregou.current || resultado) return;
    try { localStorage.setItem(chaveDoRascunho(id), JSON.stringify({ contagem, extras, inicio })); } catch (erro) { /* sem espaço */ }
  }, [id, contagem, extras, inicio, resultado]);

  // O leitor digita no campo: o foco volta para ele sempre que nada mais precisa do teclado
  const focar = useCallback(() => setTimeout(() => {
    const ativo = document.activeElement;
    if (!ativo || ativo === document.body || ativo.tagName === "BUTTON") campo.current?.focus();
  }, 60), []);
  useEffect(() => { if (compra && !confirmar && !resultado) focar(); }, [compra, confirmar, resultado, focar]);

  const porCodigo = useMemo(() => {
    const mapa = new Map();
    for (const item of itens) {
      if (item.ean) mapa.set(normalizar(item.ean), item);
      if (item.sku && !mapa.has(normalizar(item.sku))) mapa.set(normalizar(item.sku), item);
    }
    return mapa;
  }, [itens]);

  const mudar = (itemId, valor) => setContagem((atual) => ({ ...atual, [itemId]: Math.round(valor * 1000) / 1000 }));

  const aoBipar = (evento) => {
    evento.preventDefault();
    const { quantidade: qtd, codigo } = lerBipe(bipe);
    setBipe("");
    if (!codigo) return;
    if (!Number.isFinite(qtd) || qtd <= 0 || qtd > LIMITE_POR_BIPE) { tocar(false); toast.error("Quantidade inválida."); return; }

    const item = porCodigo.get(normalizar(codigo));
    if (!item) {
      tocar(false);
      setExtras((atual) => ({ ...atual, [codigo]: (atual[codigo] || 0) + qtd }));
      toast(`Código ${codigo} não é deste pedido. Separe o produto.`, { icon: "⚠️", duration: 4000 });
      return;
    }
    tocar(true);
    mudar(item.id, (contagem[item.id] || 0) + qtd);
    setDestaque(item.id);
    setTimeout(() => setDestaque((atual) => (atual === item.id ? null : atual)), 700);
    document.getElementById(`item-${item.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  const contados = itens.filter((item) => (contagem[item.id] || 0) > 0).length;
  const totalExtras = Object.keys(extras).length;

  const finalizar = async () => {
    setEnviando(true);
    try {
      const resposta = await api(`/compras/${id}/conferencia`, {
        metodo: "POST",
        corpo: {
          inicio,
          itens: itens.map((item) => ({ id: item.id, quantidade: contagem[item.id] || 0 })),
          extras: Object.entries(extras).map(([codigo, qtd]) => ({ codigo, quantidade: qtd })),
        },
      });
      if (!resposta.success) { toast.error(resposta.message || "Não foi possível finalizar."); return; }
      try { localStorage.removeItem(chaveDoRascunho(id)); } catch (erro) { /* nada */ }
      setResultado(resposta);
      tocar(resposta.resultado === "conferido");
    } catch (erro) {
      toast.error("Sem conexão. A contagem continua salva neste aparelho.");
    } finally {
      setEnviando(false);
      setConfirmar(false);
    }
  };

  if (!compra) return <CascaPagina><Carregando texto="Abrindo conferência..." /></CascaPagina>;

  const resultadoDo = (itemId) => resultado?.itens?.find((r) => r.id === itemId);
  const encerrada = ["conferido", "cancelado"].includes(compra.status_recebimento);

  return (
    <CascaPagina>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="min-w-0">
          <Link href="/compras/conferencia/" className="inline-flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400"><ArrowLeft size={15} />Fila</Link>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white mt-1">Pedido {compra.pedido_compra}</h1>
          <p className="text-zinc-500 mt-1 truncate">{compra.fornecedor_nome || "Fornecedor não informado"}{compra.data_prevista ? ` · previsto ${diaCurto(compra.data_prevista)}` : ""}</p>
        </div>
        <button type="button" onClick={() => { if (!abrirDocumento(montarMapaDeConferencia({ compra, itens }))) toast.error("Libere as janelas do navegador para imprimir."); }} className={BOTAO_SECUNDARIO}>
          <Printer size={16} />Imprimir mapa cego
        </button>
      </header>

      {resultado ? (
        <section className={`${VIDRO} p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5 ${resultado.resultado === "conferido" ? "ring-1 ring-emerald-500/30" : "ring-1 ring-rose-500/30"}`}>
          <div className={`w-16 h-16 shrink-0 rounded-[22px] flex items-center justify-center ${resultado.resultado === "conferido" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
            {resultado.resultado === "conferido" ? <CheckCircle2 size={32} /> : <AlertTriangle size={30} />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold tracking-tight">{resultado.resultado === "conferido" ? "Recebimento concluído" : `${resultado.divergentes} ${resultado.divergentes === 1 ? "item não bateu" : "itens não bateram"}`}</h2>
            <p className="text-zinc-500 mt-1">{resultado.resultado === "conferido" ? "Tudo o que foi contado bate com o pedido de compra." : "Separe os itens marcados em vermelho e avise o responsável pelas compras."}{resultado.extras ? ` ${resultado.extras} ${resultado.extras === 1 ? "código fora do pedido foi registrado" : "códigos fora do pedido foram registrados"}.` : ""}</p>
          </div>
          <Link href="/compras/conferencia/" className={BOTAO_PRIMARIO}>Próximo pedido</Link>
        </section>
      ) : encerrada ? (
        <section className={`${VIDRO} p-6 flex items-center gap-4`}>
          <ChipStatus status={compra.status_recebimento} />
          <p className="text-sm text-zinc-500">{compra.status_recebimento === "conferido" ? "Este pedido já foi conferido. Para contar de novo, o responsável precisa reabrir a conferência." : "Este pedido foi cancelado."}</p>
        </section>
      ) : (
        <form onSubmit={aoBipar} className={`${VIDRO} p-3 sm:p-4 flex items-center gap-3 sticky top-0 z-20`}>
          <div className="relative flex-1">
            <Barcode size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500" />
            <input
              ref={campo}
              value={bipe}
              onChange={(e) => setBipe(e.target.value)}
              onBlur={focar}
              placeholder="Bipe o produto · 12*código conta 12"
              aria-label="Código do produto"
              autoComplete="off"
              className={`${CAMPO} h-16 pl-14 text-lg rounded-[20px]`}
            />
          </div>
          <button type="submit" aria-label="Contar" className="hidden sm:inline-flex w-16 h-16 rounded-[20px] items-center justify-center bg-black/[0.05] dark:bg-white/[0.07] text-zinc-500"><Search size={20} /></button>
        </form>
      )}

      <ul className="space-y-2.5">
        {itens.map((item) => (
          <ItemContado key={item.id} item={item} contado={contagem[item.id] || 0} destaque={destaque === item.id} resultado={resultadoDo(item.id)} onMudar={(valor) => { if (!resultado && !encerrada) mudar(item.id, valor); }} />
        ))}
      </ul>

      {totalExtras > 0 && !resultado && (
        <section className="rounded-[22px] border border-amber-500/25 bg-amber-500/[0.06] p-4 sm:p-5">
          <p className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300"><PackageX size={17} />Fora do pedido</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {Object.entries(extras).map(([codigo, qtd]) => (
              <li key={codigo} className="inline-flex items-center gap-2 h-9 pl-3 pr-1 rounded-full bg-white/70 dark:bg-white/[0.06] text-sm font-mono">
                {codigo} <b className="font-sans">× {quantidade(qtd)}</b>
                <button type="button" aria-label={`Remover ${codigo}`} onClick={() => setExtras(({ [codigo]: _, ...resto }) => resto)} className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-rose-500"><XCircle size={16} /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!resultado && !encerrada && (
        <div className="sticky bottom-0 z-20 pb-2">
          <div className={`${VIDRO} p-3 sm:p-4 flex items-center gap-4`}>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{contados} de {itens.length} {itens.length === 1 ? "item contado" : "itens contados"}</p>
              <div className="mt-2 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                <div style={{ width: `${itens.length ? (contados / itens.length) * 100 : 0}%` }} className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-[width] duration-500" />
              </div>
            </div>
            <button type="button" onClick={() => setConfirmar(true)} disabled={contados === 0 && totalExtras === 0} className={`${BOTAO_PRIMARIO} h-14 px-7 text-base`}>
              <ClipboardCheck size={18} />Finalizar
            </button>
          </div>
        </div>
      )}

      {confirmar && (
        <Modal
          titulo="Finalizar a conferência?"
          descricao={contados < itens.length ? `${itens.length - contados} ${itens.length - contados === 1 ? "item ficou" : "itens ficaram"} sem contagem e ${itens.length - contados === 1 ? "vai" : "vão"} como zero.` : "Todos os itens foram contados."}
          onFechar={() => setConfirmar(false)}
          rodape={(
            <>
              <button type="button" onClick={() => setConfirmar(false)} className={`${BOTAO_SECUNDARIO} flex-1`}>Continuar contando</button>
              <button type="button" onClick={finalizar} disabled={enviando} className={`${BOTAO_PRIMARIO} flex-1`}>{enviando ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}Finalizar</button>
            </>
          )}
        >
          <p className="text-sm text-zinc-500 pb-2">Depois de finalizar, a contagem não pode ser alterada aqui.</p>
        </Modal>
      )}
    </CascaPagina>
  );
}

function Conferencia() {
  const id = useSearchParams().get("id");
  return id && /^\d+$/.test(id) ? <Contagem key={id} id={id} /> : <Fila />;
}

export default function PaginaDeConferencia() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-[#f5f5f7] dark:bg-black"><Loader2 className="animate-spin text-purple-600" size={32} /></div>}>
      <Conferencia />
    </Suspense>
  );
}
