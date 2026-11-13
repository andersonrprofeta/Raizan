"use client";

// "Serviços e pagamentos": o que a empresa paga à Raizan (licença do site, domínio, hospedagem, e-mail).
// Quem cadastra é a Raizan. Aqui o cliente vê os vencimentos e paga (Pix na tela ou cartão no Mercado Pago).
// O pagamento só conta depois que a API confere no Mercado Pago. O Raizan Core nunca é bloqueado por isto.

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle2, Copy, CreditCard, Globe, Mail, QrCode, Receipt, RefreshCw, Server, ShieldCheck, Sparkles } from "lucide-react";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, EstadoVazio, Modal, VIDRO, moeda } from "@/components/vendedores/ui";
import { conferirPagamento, lerServicos, pagarCobranca } from "./dados";
import { Bloco, Esqueleto, EstadoDaFonte, Etiqueta, Tile, dataHora, dataLonga } from "./comum";

const ICONES = { licenca_site: ShieldCheck, dominio: Globe, hospedagem: Server, email: Mail, outro: Sparkles };
const CORES = { licenca_site: "purple", dominio: "sky", hospedagem: "emerald", email: "amber", outro: "indigo" };
const CICLOS = { mensal: "por mês", trimestral: "por trimestre", semestral: "por semestre", anual: "por ano", unico: "pagamento único" };
const FORMAS = { pix: "Pix", credit_card: "Cartão de crédito", debit_card: "Cartão de débito", account_money: "Saldo Mercado Pago", ticket: "Boleto", transferencia: "Transferência", boleto: "Boleto", dinheiro: "Dinheiro", cortesia: "Cortesia" };

export const SITUACAO_DO_SERVICO = {
  active: { rotulo: "Em dia", tom: "verde" },
  payment_pending: { rotulo: "A pagar", tom: "azul" },
  grace_period: { rotulo: "Em carência", tom: "ambar" },
  overdue: { rotulo: "Em atraso", tom: "vermelho" },
  suspended: { rotulo: "Suspenso", tom: "vermelho" },
  cancelled: { rotulo: "Encerrado", tom: "cinza" },
};

function prazo(dias) {
  if (dias === null || dias === undefined) return "";
  if (dias > 1) return `Faltam ${dias} dias`;
  if (dias === 1) return "Vence amanhã";
  if (dias === 0) return "Vence hoje";
  return `Venceu há ${-dias} ${dias === -1 ? "dia" : "dias"}`;
}

// ---------- pagamento ----------

function JanelaDePagamento({ servico, onFechar, onPago }) {
  const cobranca = servico.cobranca_aberta;
  const [etapa, setEtapa] = useState("escolher"); // escolher | pix | cartao
  const [ocupado, setOcupado] = useState(false);
  const [pix, setPix] = useState(null);
  const [conferindo, setConferindo] = useState(false);
  const pago = useRef(false);

  const conferir = useCallback(async (manual) => {
    if (pago.current) return;
    if (manual) setConferindo(true);
    const r = await conferirPagamento(cobranca.id);
    if (manual) setConferindo(false);
    if (r.estado === "ok" && r.dados.pago) {
      pago.current = true;
      toast.success("Pagamento confirmado. Obrigado!");
      onPago();
    } else if (manual) {
      toast(r.estado === "ok" ? "Ainda não recebemos a confirmação. Se acabou de pagar, aguarde um minuto." : r.mensagem || "Não foi possível consultar agora.");
    }
  }, [cobranca.id, onPago]);

  // Com o Pix na tela, confere sozinho de tempos em tempos
  useEffect(() => {
    if (etapa !== "pix" || !pix) return undefined;
    const t = setInterval(() => conferir(false), 15000);
    return () => clearInterval(t);
  }, [etapa, pix, conferir]);

  const gerarPix = async () => {
    setOcupado(true);
    const r = await pagarCobranca(cobranca.id, "pix");
    setOcupado(false);
    if (r.estado !== "ok") return void toast.error(r.mensagem || "Não foi possível gerar o Pix.");
    setPix(r.dados.pix);
    setEtapa("pix");
  };

  const abrirCartao = async () => {
    setOcupado(true);
    const r = await pagarCobranca(cobranca.id, "checkout");
    setOcupado(false);
    if (r.estado !== "ok" || !r.dados.url) return void toast.error(r.mensagem || "Não foi possível abrir o pagamento.");
    window.open(r.dados.url, "_blank", "noopener");
    setEtapa("cartao");
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(pix.qr_code);
      toast.success("Código Pix copiado.");
    } catch (e) {
      toast.error("Não foi possível copiar. Selecione o código e copie.");
    }
  };

  return (
    <Modal titulo="Pagar serviço" descricao={`${servico.descricao} · vencimento ${dataLonga(cobranca.vencimento)}`} onFechar={onFechar}>
      <div className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] p-4 flex items-center justify-between gap-3 mb-4">
        <span className="text-sm text-zinc-500">Valor</span>
        <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{moeda(cobranca.valor)}</span>
      </div>

      {etapa === "escolher" && (
        <div className="grid gap-3 pb-4">
          <button type="button" disabled={ocupado} onClick={gerarPix} className={`${BOTAO_PRIMARIO} w-full h-12`}>
            {ocupado ? <RefreshCw size={16} className="animate-spin" /> : <QrCode size={17} />} Pagar com Pix
          </button>
          <button type="button" disabled={ocupado} onClick={abrirCartao} className={`${BOTAO_SECUNDARIO} w-full h-12`}>
            <CreditCard size={17} /> Cartão ou boleto (Mercado Pago)
          </button>
          <p className="text-xs text-zinc-500 text-center">O pagamento vai direto para a Raizan pelo Mercado Pago. A confirmação é automática.</p>
        </div>
      )}

      {etapa === "pix" && pix && (
        <div className="pb-4 flex flex-col items-center text-center">
          {pix.qr_code_base64 && (
            <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code do Pix" className="w-52 h-52 rounded-2xl bg-white p-2 border border-black/[0.06]" />
          )}
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Abra o app do banco, escolha Pix e leia o código ou use o copia e cola.</p>
          <div className="mt-3 w-full flex items-center gap-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] p-2.5">
            <code className="min-w-0 flex-1 text-[11px] text-left break-all line-clamp-3 text-zinc-600 dark:text-zinc-300">{pix.qr_code}</code>
            <button type="button" onClick={copiar} aria-label="Copiar código Pix" className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15"><Copy size={15} /></button>
          </div>
          {pix.expira_em && <p className="mt-2 text-xs text-zinc-500">Válido até {dataHora(pix.expira_em)}</p>}
          <button type="button" disabled={conferindo} onClick={() => conferir(true)} className={`${BOTAO_PRIMARIO} w-full mt-4`}>
            {conferindo ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Já paguei
          </button>
        </div>
      )}

      {etapa === "cartao" && (
        <div className="pb-4 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">A página do Mercado Pago foi aberta. Depois de pagar, volte aqui e confirme.</p>
          <button type="button" disabled={conferindo} onClick={() => conferir(true)} className={`${BOTAO_PRIMARIO} w-full mt-4`}>
            {conferindo ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Já paguei
          </button>
          <button type="button" onClick={() => setEtapa("escolher")} className="mt-3 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-white">Escolher outra forma</button>
        </div>
      )}
    </Modal>
  );
}

// ---------- tela ----------

function CartaoServico({ servico, podePagar, onPagar }) {
  const situacao = SITUACAO_DO_SERVICO[servico.situacao] || SITUACAO_DO_SERVICO.active;
  const aberta = servico.cobranca_aberta;
  const atrasado = ["grace_period", "overdue", "suspended"].includes(servico.situacao);
  return (
    <div className={`${VIDRO} p-5 min-w-0 flex flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <Tile icone={ICONES[servico.tipo] || Sparkles} cor={CORES[servico.tipo] || "purple"} tamanho={38} />
        <Etiqueta tom={situacao.tom} ponto>{situacao.rotulo}</Etiqueta>
      </div>
      <p className="mt-4 text-[13px] font-medium text-zinc-500">{servico.tipo_rotulo}{servico.site ? ` · ${servico.site}` : ""}</p>
      <p className="font-semibold tracking-tight text-zinc-900 dark:text-white mt-0.5 break-words">{servico.descricao}</p>
      <p className="text-sm text-zinc-500 mt-1">{moeda(servico.valor)} {CICLOS[servico.ciclo] || ""}</p>

      <div className="mt-4 pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-end justify-between gap-3 mt-auto">
        <div className="min-w-0">
          <p className="text-[12px] text-zinc-500">Vencimento</p>
          <p className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{servico.vence_em ? dataLonga(servico.vence_em) : "—"}</p>
          <p className={`text-xs ${atrasado ? "text-rose-600 dark:text-rose-400" : "text-zinc-500"}`}>{prazo(servico.dias_para_vencer)}</p>
        </div>
        {aberta && podePagar && (
          <button type="button" onClick={() => onPagar(servico)} className={`${BOTAO_PRIMARIO} h-10 px-4 shrink-0`}>Pagar agora</button>
        )}
      </div>
      {atrasado && servico.suspende_o_site && servico.situacao !== "suspended" && servico.carencia_ate && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">Sem pagamento até {dataLonga(servico.carencia_ate)}, o site fica temporariamente fora do ar.</p>
      )}
      {servico.situacao === "suspended" && servico.suspende_o_site && (
        <p className="mt-3 text-xs text-rose-700 dark:text-rose-300">O site está fora do ar. Ele volta sozinho assim que o pagamento for confirmado.</p>
      )}
    </div>
  );
}

export default function Servicos({ discreto = false }) {
  const [resposta, setResposta] = useState(null);
  const [pagando, setPagando] = useState(null);

  const carregar = useCallback(async () => {
    setResposta(await lerServicos());
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  // Discreto (sem site instalado): só aparece se houver serviço; nada de aviso de erro ou vazio
  if (discreto && (resposta?.estado !== "ok" || !(resposta.dados.servicos || []).length)) return null;
  if (!resposta) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Esqueleto key={i} altura={220} />)}</div>;
  }
  if (resposta.estado !== "ok") return <div className={VIDRO}><EstadoDaFonte resposta={resposta} onTentar={carregar} titulo="Serviços ainda não ativados" /></div>;

  const { servicos = [], pagamentos = [], pagamento_disponivel: podePagar } = resposta.dados;
  if (!servicos.length && !pagamentos.length) {
    return <div className={VIDRO}><EstadoVazio icone={Receipt} titulo="Nenhum serviço cadastrado" texto="Quando a Raizan cadastrar a licença do site, o domínio ou a hospedagem, os vencimentos aparecem aqui." /></div>;
  }

  const urgentes = servicos.filter((s) => ["grace_period", "overdue", "suspended"].includes(s.situacao));
  const aPagar = servicos.filter((s) => s.cobranca_aberta);
  const totalAberto = aPagar.reduce((soma, s) => soma + Number(s.cobranca_aberta.valor || 0), 0);

  return (
    <div className="space-y-6">
      {urgentes.length > 0 && (
        <div className="rounded-[24px] border border-rose-500/25 bg-rose-500/[0.07] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <AlertTriangle size={22} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">{urgentes.length === 1 ? "1 serviço com pagamento em atraso" : `${urgentes.length} serviços com pagamento em atraso`}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{urgentes.map((s) => s.descricao).join(", ")}. O Raizan Core continua funcionando normalmente.</p>
          </div>
        </div>
      )}

      {aPagar.length > 0 && (
        <div className={`${VIDRO} p-5 flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <p className="text-[13px] text-zinc-500">Em aberto</p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white tabular-nums">{moeda(totalAberto)}</p>
          </div>
          {!podePagar && <p className="text-sm text-zinc-500 max-w-sm">O pagamento online ainda não está disponível. Fale com a Raizan para pagar.</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
        {servicos.map((s) => <CartaoServico key={s.id} servico={s} podePagar={podePagar} onPagar={setPagando} />)}
      </div>

      <Bloco titulo="Pagamentos" icone={Receipt} cor="purple">
        {pagamentos.length ? (
          <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05] -my-2">
            {pagamentos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-zinc-900 dark:text-white truncate">{p.servico}</p>
                  <p className="text-xs text-zinc-500">Referente a {dataLonga(p.referente_a)} · {FORMAS[p.forma] || p.forma || "—"} · {dataHora(p.pago_em)}</p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-white">{moeda(p.valor)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Nenhum pagamento registrado ainda.</p>
        )}
      </Bloco>

      {pagando && (
        <JanelaDePagamento
          servico={pagando}
          onFechar={() => setPagando(null)}
          onPago={() => { setPagando(null); carregar(); }}
        />
      )}
    </div>
  );
}
