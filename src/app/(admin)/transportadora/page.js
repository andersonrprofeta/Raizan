"use client";

// Central Logística do Raizan Core: torre de controle da expedição.
// Fluxo: pedido faturado (NF-e) -> Expedição -> Romaneio gerado (= hora da coleta) -> rastreamento -> entregue.
// Especificação do dono: src/components/transportadora/page.js (comentário).

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Building2, ClipboardList, LayoutDashboard, PackageSearch, RefreshCw, Truck } from "lucide-react";
import { api, BOTAO_SECUNDARIO, Carregando, CascaPagina, Segmentado, VIDRO } from "@/components/vendedores/ui";
import { BOTAO, CaminhaoAnimado } from "@/components/transportadora/ui";
import { Painel } from "@/components/transportadora/Painel";
import { Expedicao } from "@/components/transportadora/Expedicao";
import { Romaneios } from "@/components/transportadora/Romaneios";
import { Transportadoras } from "@/components/transportadora/Transportadoras";
import { ModalRomaneio } from "@/components/transportadora/ModalRomaneio";

const ABAS = [
  { id: "painel", rotulo: "Painel", icone: LayoutDashboard },
  { id: "expedicao", rotulo: "Expedição", icone: PackageSearch },
  { id: "romaneios", rotulo: "Romaneios", icone: ClipboardList },
  { id: "transportadoras", rotulo: "Transportadoras", icone: Building2 },
];
const VISOES = ["aguardando", "transito", "atrasadas", "ocorrencias", "entregues"];

export default function CentralLogistica() {
  const [aba, setAba] = useState("painel");
  const [visao, setVisao] = useState("aguardando");
  const [periodo, setPeriodo] = useState("30");
  const [painel, setPainel] = useState(null);
  const [transportadoras, setTransportadoras] = useState([]);
  const [montagem, setMontagem] = useState(null);
  const [romaneioAberto, setRomaneioAberto] = useState(null);
  const [versao, setVersao] = useState(0);
  const [sincronizando, setSincronizando] = useState(false);
  const pedidoAtual = useRef(0);

  // Links diretos: /transportadora?aba=expedicao&visao=atrasadas
  useEffect(() => {
    const busca = new URLSearchParams(window.location.search);
    if (ABAS.some((a) => a.id === busca.get("aba"))) setAba(busca.get("aba"));
    if (VISOES.includes(busca.get("visao"))) setVisao(busca.get("visao"));
  }, []);

  const trocarAba = (id) => {
    setAba(id);
    const url = new URL(window.location.href);
    url.searchParams.set("aba", id);
    window.history.replaceState(null, "", url);
  };

  const carregarPainel = useCallback(async () => {
    const numero = ++pedidoAtual.current;
    try {
      const r = await api(`/logistica/painel?periodo=${periodo}`);
      if (numero !== pedidoAtual.current) return;
      if (!r.success) { toast.error(r.message || "Não foi possível carregar o painel."); return; }
      setPainel(r);
    } catch (erro) { if (numero === pedidoAtual.current) toast.error("Sem conexão com o servidor."); }
  }, [periodo]);

  const carregarTransportadoras = useCallback(async () => {
    try {
      const r = await api("/logistica/transportadoras");
      if (r.success) setTransportadoras(r.transportadoras);
    } catch (erro) { /* a lista aparece vazia no romaneio */ }
  }, []);

  useEffect(() => { carregarPainel(); }, [carregarPainel, versao]);
  useEffect(() => { carregarTransportadoras(); }, [carregarTransportadoras]);

  const irPara = (destino, novaVisao, romaneioId) => {
    if (novaVisao) setVisao(novaVisao);
    if (romaneioId) setRomaneioAberto(romaneioId);
    trocarAba(destino);
  };

  const sincronizar = async () => {
    setSincronizando(true);
    const aviso = toast.loading("Lendo NF-es e transportadoras da integração...");
    try {
      const [notas, cadastro] = await Promise.all([
        api("/logistica/expedicoes/sincronizar-nfe", { metodo: "POST", corpo: { dias: 30 } }),
        api("/logistica/transportadoras/sincronizar", { metodo: "POST" }),
      ]);
      const mensagens = [notas, cadastro].map((r) => r.message).filter(Boolean).join(" ");
      (notas.success || cadastro.success ? toast.success : toast.error)(mensagens || "Sincronização concluída.", { id: aviso, duration: 9000 });
      carregarTransportadoras();
      setVersao((v) => v + 1);
    } catch (erro) {
      toast.error("Sem conexão com o servidor.", { id: aviso });
    } finally {
      setSincronizando(false);
    }
  };

  const k = painel?.indicadores;

  return (
    <CascaPagina>
      <header className={`${VIDRO} relative overflow-hidden`}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute right-40 -bottom-32 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        </div>
        <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Logística</p>
            <h1 className="mt-1 text-3xl sm:text-[42px] sm:leading-[1.05] font-semibold tracking-tight text-zinc-900 dark:text-white">Central Logística</h1>
            <p className="mt-3 max-w-lg text-zinc-500">Do pedido faturado à entrega: monte o romaneio, registre a coleta e acompanhe cada carga até o cliente.</p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => irPara("expedicao", "aguardando")} className={BOTAO}><Truck size={16} />Montar romaneio</button>
              <button type="button" onClick={sincronizar} disabled={sincronizando} className={BOTAO_SECUNDARIO}><RefreshCw size={16} className={sincronizando ? "animate-spin" : ""} />Sincronizar</button>
            </div>
          </div>
          <div className="relative text-zinc-900 dark:text-white">
            <CaminhaoAnimado className="mx-auto w-full max-w-[420px]" parado={!k?.em_transito && !k?.aguardando_coleta} />
            {k && (
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {[
                  [k.aguardando_coleta, "aguardando coleta", "bg-amber-500"],
                  [k.em_transito, "em trânsito", "bg-purple-500"],
                  [k.em_atraso, "em atraso", "bg-rose-500"],
                ].map(([valor, rotulo, ponto]) => (
                  <span key={rotulo} className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 ring-1 ring-black/[0.05] dark:ring-white/[0.08] backdrop-blur">
                    <span className={`h-1.5 w-1.5 rounded-full ${ponto} ${valor ? "animate-pulse" : "opacity-40"}`} />
                    <span className="tabular-nums">{valor}</span> {rotulo}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <Segmentado opcoes={ABAS} valor={aba} onChange={trocarAba} grande />

      {aba === "painel" && (painel ? <Painel dados={painel} periodo={periodo} onPeriodo={setPeriodo} irPara={irPara} /> : <div className={VIDRO}><Carregando texto="Montando o painel..." /></div>)}
      {aba === "expedicao" && <Expedicao visao={visao} onVisao={setVisao} versao={versao} onMontar={(selecionadas, limpar) => setMontagem({ expedicoes: selecionadas, limpar })} />}
      {aba === "romaneios" && (
        <Romaneios
          abrirId={romaneioAberto}
          versao={versao}
          onEditar={(detalhe) => setMontagem({ romaneio: detalhe.romaneio, expedicoes: detalhe.expedicoes })}
        />
      )}
      {aba === "transportadoras" && <Transportadoras versao={versao} onMudou={() => { carregarTransportadoras(); carregarPainel(); }} />}

      {montagem && (
        <ModalRomaneio
          expedicoes={montagem.expedicoes}
          romaneio={montagem.romaneio}
          transportadoras={transportadoras}
          onFechar={() => setMontagem(null)}
          onSalvo={(id) => {
            montagem.limpar?.();
            setMontagem(null);
            setRomaneioAberto(id);
            setVersao((v) => v + 1);
            trocarAba("romaneios");
          }}
        />
      )}
    </CascaPagina>
  );
}
