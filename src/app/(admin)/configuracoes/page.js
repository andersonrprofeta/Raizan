"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Database, Loader2, Save, ShoppingBag, Smartphone, Store } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AbaEcommerce from "@/components/parametros/AbaEcommerce";
import AbaOracle from "@/components/parametros/AbaOracle";
import AbaPrazos from "@/components/parametros/AbaPrazos";
import AbaRaizanSeller from "@/components/parametros/AbaRaizanSeller";
import { CAMPO, Grupo, LinhaCampo, LinhaSwitch } from "@/components/parametros/ui";
import { getHeaders, getHubUrl } from "@/components/utils/api";
import { Segmentado, VIDRO } from "@/components/vendedores/ui";

const ENDERECO = `${getHubUrl()}/api/hub/parametros`;

const GUIAS = [
  { id: "app", rotulo: "Raizan Seller", icone: Smartphone },
  { id: "portal", rotulo: "Portal B2B", icone: Store },
  { id: "ecommerce", rotulo: "E-commerce", icone: ShoppingBag },
  { id: "prazos", rotulo: "Prazos", icone: CalendarClock },
  { id: "oracle", rotulo: "Oracle", icone: Database },
];

export default function ParametrosDoSistema() {
  const [guia, setGuia] = useState("app");
  const [parametros, setParametros] = useState(null);
  const [opcoes, setOpcoes] = useState({ marcas: [], vendedores: [], ufs: [] });
  const [falhou, setFalhou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alterado, setAlterado] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const resposta = await fetch(ENDERECO, { headers: getHeaders() });
        const dados = await resposta.json();
        if (!dados.success) throw new Error(dados.message);
        setParametros(dados.parametros);
        setOpcoes(dados.opcoes);
      } catch (erro) {
        setFalhou(true);
      }
    })();
  }, []);

  // Sair com o switch ligado e sem salvar faria a regra parecer ativa sem estar
  useEffect(() => {
    if (!alterado) return undefined;
    const avisar = (evento) => { evento.preventDefault(); evento.returnValue = ""; };
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [alterado]);

  const alterar = (secao) => (mudanca) => {
    setParametros((atuais) => ({ ...atuais, [secao]: { ...atuais[secao], ...mudanca } }));
    setAlterado(true);
  };

  const salvar = async () => {
    setSalvando(true);
    try {
      const resposta = await fetch(ENDERECO, { method: "PUT", headers: { ...getHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(parametros) });
      const dados = await resposta.json();
      if (!dados.success) throw new Error(dados.message);
      setParametros(dados.parametros);
      setAlterado(false);
      toast.success("Parâmetros salvos!");
    } catch (erro) {
      toast.error(erro.message || "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] text-zinc-900 antialiased transition-colors duration-300 dark:bg-[#09090b] dark:text-zinc-100">
      <Sidebar />
      <div className="relative flex h-screen min-w-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-40 left-1/4 h-[560px] w-[560px] rounded-full bg-purple-400/20 blur-[120px] dark:bg-purple-600/10" />
        </div>

        <Header />

        <main className="custom-scrollbar relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl space-y-6 pb-20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-[32px] sm:leading-tight">Parâmetros de sistema</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Regras comerciais de cada canal de venda.</p>
              </div>
              {guia !== "oracle" && parametros && (
                <button type="button" onClick={salvar} disabled={!alterado || salvando} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                </button>
              )}
            </div>

            <Segmentado opcoes={GUIAS} valor={guia} onChange={setGuia} />

            {guia === "oracle" ? (
              <AbaOracle />
            ) : falhou ? (
              <p className={`${VIDRO} p-8 text-center text-sm text-zinc-500`}>Não foi possível carregar os parâmetros. Entre novamente no Core e tente de novo.</p>
            ) : !parametros ? (
              <div className={`${VIDRO} flex justify-center p-14`}><Loader2 size={28} className="animate-spin text-purple-500" /></div>
            ) : guia === "app" ? (
              <AbaRaizanSeller parametros={parametros} opcoes={opcoes} alterarApp={alterar("app")} alterarProvadores={alterar("provadores")} />
            ) : guia === "prazos" ? (
              <AbaPrazos prazosLiberados={parametros.pagamentos.prazos_liberados} onChange={(prazos_liberados) => alterar("pagamentos")({ prazos_liberados })} />
            ) : guia === "portal" ? (
              <div className="space-y-6">
              <Grupo titulo="Catálogo do portal" texto="Vale para os lojistas na próxima vez que abrirem o portal.">
                <LinhaSwitch titulo="Não enviar produtos sem estoque" texto="Produto zerado some do portal." ligado={parametros.portal.ocultar_sem_estoque} onChange={(valor) => alterar("portal")({ ocultar_sem_estoque: valor })} />
                <LinhaSwitch titulo="Não enviar produtos bonificados" texto="As marcas bonificadas somem do portal. O começo do nome é o definido na guia Raizan Seller." ligado={parametros.portal.ocultar_provadores} onChange={(valor) => alterar("portal")({ ocultar_provadores: valor })} />
                <LinhaSwitch titulo="Não misturar bonificado com produto normal" texto="O pedido é recusado ao finalizar, com o motivo na tela." desativado={parametros.portal.ocultar_provadores} ligado={parametros.portal.separar_provadores} onChange={(valor) => alterar("portal")({ separar_provadores: valor })} />
              </Grupo>
              <Grupo titulo="Preço para pessoa física" texto="Exclusivo do portal. App e e-commerce continuam com o preço normal.">
                <LinhaCampo titulo="Acréscimo para CPF (%)" texto="Somado ao preço de quem entra com CPF, inclusive em promoções. Quem entra com CNPJ paga o preço normal. Use 0 para não aplicar.">
                  <input inputMode="decimal" value={parametros.portal.acrescimo_cpf ?? ""} onChange={(e) => alterar("portal")({ acrescimo_cpf: e.target.value })} placeholder="0" aria-label="Acréscimo para CPF" className={CAMPO} />
                </LinhaCampo>
              </Grupo>
              </div>
            ) : (
              <AbaEcommerce ecommerce={parametros.ecommerce} opcoes={opcoes} alterar={alterar("ecommerce")} />
            )}

            {alterado && guia !== "oracle" && (
              <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-full border border-amber-500/30 bg-white/95 py-2 pl-5 pr-2 shadow-xl backdrop-blur-xl dark:bg-[#1a1a1d]/95">
                <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Alterações ainda não salvas</span>
                <button type="button" onClick={salvar} disabled={salvando} className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-gradient-to-b from-purple-500 to-purple-700 px-5 text-sm font-semibold text-white disabled:opacity-50">
                  {salvando ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
