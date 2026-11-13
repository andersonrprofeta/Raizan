"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Activity, BookOpen, CheckCircle2, ChevronRight, ClipboardCopy, Eye, FileText, Globe, KeyRound, Link2Off,
  Mail, MessageCircle, MousePointerClick, Pencil, Phone, PlugZap, RefreshCw, ShieldCheck, Target, Users, XCircle,
} from "lucide-react";
import { BOTAO_PRIMARIO, BOTAO_SECUNDARIO, CAMPO, Modal, ROTULO } from "@/components/vendedores/ui";
import { getHubUrl } from "@/components/utils/api";
import { SITUACAO_DO_SERVICO } from "./Servicos";
import {
  desconectarSite, editarSite, gerarChave, lerAnalytics, lerInteracoes, lerServicos, revogarChave, testarConexao,
} from "./dados";
import {
  Bloco, Esqueleto, Etiqueta, IndicadorSite, STATUS_CONEXAO, STATUS_INTERACAO,
  dataHora, dataLonga, intervaloDoPeriodo, nomeDoContato, numero, percentual, tempoRelativo,
} from "./comum";

const BOTAO_ACAO =
  "inline-flex items-center gap-2 h-10 px-4 rounded-full text-[13px] font-semibold text-zinc-700 dark:text-zinc-200 " +
  "bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] transition-all active:scale-95 disabled:opacity-40";

function Linha({ rotulo, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0">
      <span className="text-[13px] text-zinc-500 shrink-0">{rotulo}</span>
      <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

// O script é servido pela mesma API que o Core usa (sem endereço fixo no código)
const instrucoesDeInstalacao = (site, chave) => `Raizan Insight: conexão do site ${site.dominio}

1. Instale UMA vez só, no lugar que todas as páginas usam (o cabeçalho do tema, o layout
   principal ou o campo "scripts no <head>" da plataforma). Não precisa colar página por página:

<script async src="${getHubUrl()}/api/v1/site/raizan-insight.js"
        data-site-id="${site.id}"
        data-key="${chave || "SUA_CHAVE_PUBLICA"}"></script>

   Site feito em Next.js? Prefira variáveis de ambiente no build
   (o layout principal monta a tag acima com elas):
   NEXT_PUBLIC_RAIZAN_SITE_ID=${site.id}
   NEXT_PUBLIC_RAIZAN_SITE_KEY=${chave || "SUA_CHAVE_PUBLICA"}

2. Formulários: adicione o atributo data-raizan-form="nome-do-formulario" na tag <form>.
   Botões importantes (opcional): data-raizan-cta="Pedir orçamento".
3. Publique o site e use "Testar conexão" no Raizan Core.

A chave acima é pública (só envia eventos). Ela não lê dados e só funciona no domínio cadastrado.
IMPORTANTE: se a chave for rotacionada no Raizan Core, a antiga para na hora. Troque a chave
no site (ou na variável de ambiente), gere o build e publique de novo.
Detalhes técnicos: docs/RAIZAN-SITE-INTEGRATION.md na API.`;

// ---------- Cartão do site e ações da integração ----------

function CartaoDoSite({ site, tenantId, onAtualizar }) {
  const [ocupado, setOcupado] = useState("");
  const [chaveNova, setChaveNova] = useState(null);
  const [foiRotacao, setFoiRotacao] = useState(false);
  const [editando, setEditando] = useState(false);
  const [dominio, setDominio] = useState(site.dominio || "");
  const [confirmar, setConfirmar] = useState(null); // "revogar" | "desconectar"
  const [documentacao, setDocumentacao] = useState(false);
  const conexao = STATUS_CONEXAO[site.status_conexao] || STATUS_CONEXAO.desconectado;

  const executar = async (rotulo, acao, sucesso) => {
    setOcupado(rotulo);
    const r = await acao();
    setOcupado("");
    if (r.estado !== "ok") {
      toast.error(r.estado === "indisponivel" ? "Essa ação ainda não está disponível no servidor." : r.mensagem);
      return null;
    }
    if (sucesso) toast.success(sucesso);
    return r.dados;
  };

  const aoGerarChave = async () => {
    const rotacao = Boolean(site.tem_chave);
    const dados = await executar("chave", () => gerarChave(site.id));
    if (dados?.chave) {
      setFoiRotacao(rotacao);
      setChaveNova(dados.chave);
      onAtualizar();
    }
  };

  const aoTestar = async () => {
    const dados = await executar("testar", () => testarConexao(site.id));
    if (dados) toast.success(dados.recebido_em ? `Conexão confirmada: último sinal ${tempoRelativo(dados.recebido_em)}` : "Conexão confirmada.");
  };

  const aoSalvarDominio = async () => {
    const limpo = dominio.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(limpo)) return toast.error("Digite um domínio válido, por exemplo: empresa.com.br");
    const dados = await executar("dominio", () => editarSite(site.id, { dominio: limpo }), "Domínio atualizado.");
    if (dados) {
      setEditando(false);
      onAtualizar();
    }
  };

  const aoConfirmar = async () => {
    const acao = confirmar;
    setConfirmar(null);
    if (acao === "rotacionar") return aoGerarChave();
    if (acao === "revogar") await executar("revogar", () => revogarChave(site.id), "Chave revogada. O site parou de enviar dados.");
    if (acao === "desconectar") await executar("desconectar", () => desconectarSite(site.id), "Site desconectado. Os dados já recebidos continuam guardados.");
    onAtualizar();
  };

  const copiar = async (texto, aviso) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(aviso);
    } catch (e) {
      toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  return (
    <Bloco
      titulo="Integração do site"
      icone={Globe}
      cor="purple"
      className="xl:col-span-2"
      acao={<Etiqueta tom={conexao.tom} ponto>{conexao.rotulo}</Etiqueta>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div>
          <Linha rotulo="Nome do site">{site.nome || "—"}</Linha>
          <Linha rotulo="Domínio principal">{site.dominio || "—"}</Linha>
          <Linha rotulo="Última comunicação">{site.ultima_comunicacao ? `${dataHora(site.ultima_comunicacao)} (${tempoRelativo(site.ultima_comunicacao)})` : "Nunca"}</Linha>
          <Linha rotulo="Coleta de eventos">
            {site.coleta_ativa ? <Etiqueta tom="verde" ponto>Ativa</Etiqueta> : <Etiqueta tom="ambar" ponto>Parada</Etiqueta>}
          </Linha>
          <Linha rotulo="API">
            {site.api_ok === false ? <Etiqueta tom="vermelho" ponto>Com falha</Etiqueta> : <Etiqueta tom="verde" ponto>Operando</Etiqueta>}
          </Linha>
          <Linha rotulo="Último evento recebido">{site.ultimo_evento ? tempoRelativo(site.ultimo_evento) : "Nenhum ainda"}</Linha>
        </div>
        <div>
          <Linha rotulo="Identificador do site"><code className="text-xs">{site.id}</code></Linha>
          <Linha rotulo="Empresa vinculada"><code className="text-xs">{tenantId || "—"}</code></Linha>
          <Linha rotulo="Chave de integração">
            {site.tem_chave ? <code className="text-xs">{site.chave_prefixo}••••••••</code> : <span className="text-amber-600 dark:text-amber-400">Não gerada</span>}
          </Linha>
          <Linha rotulo="Instalado em">{dataLonga(site.instalado_em)}</Linha>
          <Linha rotulo="Plataforma">{site.plataforma || "Qualquer (script ou API)"}</Linha>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        <button type="button" onClick={() => (site.tem_chave ? setConfirmar("rotacionar") : aoGerarChave())} disabled={!!ocupado} className={BOTAO_ACAO}>
          {ocupado === "chave" ? <RefreshCw size={15} className="animate-spin" /> : <KeyRound size={15} />}
          {site.tem_chave ? "Rotacionar chave" : "Gerar chave"}
        </button>
        <button type="button" onClick={() => copiar(instrucoesDeInstalacao(site), "Instruções copiadas.")} className={BOTAO_ACAO}>
          <ClipboardCopy size={15} /> Copiar instruções
        </button>
        <button type="button" onClick={aoTestar} disabled={!!ocupado} className={BOTAO_ACAO}>
          {ocupado === "testar" ? <RefreshCw size={15} className="animate-spin" /> : <Activity size={15} />} Testar conexão
        </button>
        <button type="button" onClick={() => setEditando(true)} className={BOTAO_ACAO}><Pencil size={15} /> Editar domínio</button>
        <button type="button" onClick={() => setDocumentacao(true)} className={BOTAO_ACAO}><BookOpen size={15} /> Documentação</button>
        {site.tem_chave && (
          <button type="button" onClick={() => setConfirmar("revogar")} className={`${BOTAO_ACAO} !text-rose-600 dark:!text-rose-400`}><XCircle size={15} /> Revogar chave</button>
        )}
        <button type="button" onClick={() => setConfirmar("desconectar")} className={`${BOTAO_ACAO} !text-rose-600 dark:!text-rose-400`}><Link2Off size={15} /> Desconectar site</button>
      </div>

      {chaveNova && (
        <Modal
          titulo="Chave gerada"
          descricao="Copie agora. Por segurança, ela não será exibida de novo."
          onFechar={() => setChaveNova(null)}
          rodape={<>
            <button type="button" onClick={() => copiar(instrucoesDeInstalacao(site, chaveNova), "Instruções com a chave copiadas.")} className={`${BOTAO_SECUNDARIO} flex-1`}>Copiar instruções</button>
            <button type="button" onClick={() => copiar(chaveNova, "Chave copiada.")} className={`${BOTAO_PRIMARIO} flex-1`}><ClipboardCopy size={16} /> Copiar chave</button>
          </>}
        >
          <div className="rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] p-4 font-mono text-sm break-all text-zinc-900 dark:text-zinc-100 select-all">{chaveNova}</div>
          {foiRotacao && (
            <div className="mt-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] p-3 text-xs text-amber-800 dark:text-amber-300">
              <b>A chave anterior já parou de funcionar.</b> O site fica sem enviar visitas e formulários até você trocar a chave nele
              (no script ou na variável de ambiente NEXT_PUBLIC_RAIZAN_SITE_KEY), gerar o build e publicar de novo.
            </div>
          )}
        </Modal>
      )}

      {editando && (
        <Modal
          titulo="Editar domínio"
          descricao="O site só consegue enviar dados a partir do domínio cadastrado."
          onFechar={() => setEditando(false)}
          rodape={<>
            <button type="button" onClick={() => setEditando(false)} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
            <button type="button" onClick={aoSalvarDominio} disabled={ocupado === "dominio"} className={`${BOTAO_PRIMARIO} flex-1`}>Salvar</button>
          </>}
        >
          <label className={ROTULO} htmlFor="dominio-site">Domínio principal</label>
          <input id="dominio-site" value={dominio} onChange={(e) => setDominio(e.target.value)} placeholder="empresa.com.br" className={CAMPO} autoFocus />
        </Modal>
      )}

      {confirmar && (
        <Modal
          titulo={{ rotacionar: "Rotacionar a chave?", revogar: "Revogar a chave?" }[confirmar] || "Desconectar o site?"}
          descricao={{
            rotacionar: "A chave atual para de funcionar na hora. O site só volta a enviar visitas e formulários depois que você trocar a chave nele (no script ou na variável de ambiente), gerar o build e publicar de novo. Faça isso só se a chave vazou ou se o site vai ser reinstalado.",
            revogar: "O site para de enviar visitas e formulários até uma nova chave ser instalada.",
          }[confirmar] || "A coleta para e a chave é revogada. Nada é apagado: os dados recebidos continuam guardados."}
          onFechar={() => setConfirmar(null)}
          rodape={<>
            <button type="button" onClick={() => setConfirmar(null)} className={`${BOTAO_SECUNDARIO} flex-1`}>Cancelar</button>
            <button type="button" onClick={aoConfirmar} className="flex-1 inline-flex items-center justify-center h-11 rounded-full text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-all active:scale-95">
              {{ rotacionar: "Rotacionar", revogar: "Revogar" }[confirmar] || "Desconectar"}
            </button>
          </>}
        />
      )}

      {documentacao && (
        <Modal titulo="Como conectar um site" descricao="Funciona com Next.js, React, WordPress, WooCommerce, Shopify, Raizan Commerce ou qualquer sistema que chame uma API." onFechar={() => setDocumentacao(false)} largura="max-w-lg">
          <ol className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300 pb-4">
            <li><b className="text-zinc-900 dark:text-white">1. Gere a chave.</b> Ela é pública: só envia eventos e só vale no domínio cadastrado.</li>
            <li><b className="text-zinc-900 dark:text-white">2. Instale o script uma vez só</b>, no cabeçalho ou layout que todas as páginas usam. Em sites Next.js, use as variáveis de ambiente NEXT_PUBLIC_RAIZAN_SITE_ID e NEXT_PUBLIC_RAIZAN_SITE_KEY. Ou envie os eventos direto para a API de ingestão.</li>
            <li><b className="text-zinc-900 dark:text-white">Rotacionou a chave?</b> A antiga para na hora: troque no site, gere o build e publique de novo.</li>
            <li><b className="text-zinc-900 dark:text-white">3. Marque os formulários.</b> Todos os campos são guardados, sejam 3 ou 30, sem precisar mudar nada no Core.</li>
            <li><b className="text-zinc-900 dark:text-white">4. Teste a conexão</b> aqui mesmo. O primeiro evento muda o status para Conectado.</li>
          </ol>
          <p className="text-xs text-zinc-500 pb-4">A coleta não guarda IP completo nem usa GPS. A região é aproximada e respeita a LGPD.</p>
        </Modal>
      )}
    </Bloco>
  );
}

// ---------- Serviços resumidos (licença do site, domínio, hospedagem) ----------

function CartaoServicos({ servicos, siteId, onAbrirServicos }) {
  const doSite = servicos.filter((s) => !s.site_id || s.site_id === siteId);
  if (!doSite.length) {
    return (
      <Bloco titulo="Serviços do site" icone={ShieldCheck} cor="emerald">
        <p className="text-sm text-zinc-500">A Raizan ainda não cadastrou licença, domínio ou hospedagem deste site.</p>
      </Bloco>
    );
  }
  const pior = doSite.find((s) => ["suspended", "overdue", "grace_period"].includes(s.situacao)) || doSite.find((s) => s.situacao === "payment_pending");
  const geral = pior ? SITUACAO_DO_SERVICO[pior.situacao] : SITUACAO_DO_SERVICO.active;
  return (
    <Bloco titulo="Serviços do site" icone={ShieldCheck} cor="emerald" acao={<Etiqueta tom={geral.tom} ponto>{geral.rotulo}</Etiqueta>}>
      {doSite.slice(0, 5).map((s) => {
        const dias = s.dias_para_vencer;
        return (
          <Linha key={s.id} rotulo={s.descricao}>
            {dataLonga(s.vence_em)}
            {dias !== null && dias !== undefined && dias < 0 && <span className="block text-[11px] text-rose-600 dark:text-rose-400">Venceu há {-dias} {dias === -1 ? "dia" : "dias"}</span>}
            {dias !== null && dias !== undefined && dias >= 0 && dias <= 30 && <span className="block text-[11px] text-amber-600 dark:text-amber-400">{dias === 0 ? "Vence hoje" : `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`}</span>}
          </Linha>
        );
      })}
      <button type="button" onClick={onAbrirServicos} className="mt-4 w-full inline-flex items-center justify-center gap-1 h-10 rounded-full text-[13px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/15 transition-colors">
        {pior ? "Ver e pagar" : "Ver serviços e pagamentos"} <ChevronRight size={15} />
      </button>
    </Bloco>
  );
}

// ---------- Central de oportunidades ----------

function UltimasInteracoes({ itens, onAbrir }) {
  if (!itens.length) {
    return <p className="text-sm text-zinc-500 py-6 text-center">Nenhum formulário recebido nos últimos 30 dias.</p>;
  }
  return (
    <ul className="divide-y divide-black/[0.05] dark:divide-white/[0.05] -my-2">
      {itens.map((item) => {
        const status = STATUS_INTERACAO[item.status] || STATUS_INTERACAO.novo;
        return (
          <li key={item.id}>
            <button type="button" onClick={() => onAbrir(item.id)} className="w-full flex items-center gap-3 py-3 text-left group">
              <span className={`w-2 h-2 rounded-full shrink-0 ${item.nova ? "bg-purple-500" : "bg-transparent"}`} aria-label={item.nova ? "Nova" : undefined} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{nomeDoContato(item)}</p>
                <p className="text-xs text-zinc-500 truncate">{item.formulario} · {tempoRelativo(item.recebido_em)}</p>
              </div>
              <Etiqueta tom={status.tom}>{status.rotulo}</Etiqueta>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function VisaoGeral({ site, tenantId, blocos, onAtualizarSites, onIrPara }) {
  const [estado, setEstado] = useState({ carregando: true, analytics: null, interacoes: null, gestao: null });

  const carregar = useCallback(async () => {
    setEstado((e) => ({ ...e, carregando: true }));
    const intervalo = intervaloDoPeriodo("30d");
    // Cada fonte carrega sozinha: uma falha não derruba as outras
    const [analytics, interacoes, gestao] = await Promise.all([
      blocos.has("indicadores") ? lerAnalytics({ site_id: site.id, ...intervalo }) : null,
      blocos.has("oportunidades") ? lerInteracoes({ site_id: site.id }) : null,
      blocos.has("licenca") ? lerServicos() : null,
    ]);
    setEstado({ carregando: false, analytics, interacoes, gestao });
  }, [site.id, blocos]);

  useEffect(() => { carregar(); }, [carregar]);

  const resumo = estado.analytics?.estado === "ok" ? estado.analytics.dados.resumo : null;
  const interacoes = estado.interacoes?.estado === "ok" ? estado.interacoes.dados : null;
  const aguardando = interacoes ? interacoes.itens.filter((i) => i.status === "novo") : [];

  return (
    <div className="space-y-6">
      {blocos.has("indicadores") && (
        estado.carregando ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">{Array.from({ length: 6 }, (_, i) => <Esqueleto key={i} altura={136} />)}</div>
        ) : resumo ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            <IndicadorSite rotulo="Visitas (30 dias)" valor={numero(resumo.visitas)} icone={Eye} cor="sky" />
            <IndicadorSite rotulo="Visitantes únicos" valor={numero(resumo.visitantes)} icone={Users} cor="indigo" />
            <IndicadorSite rotulo="Novos leads" valor={numero(interacoes ? interacoes.resumo.novo : null)} icone={Target} cor="purple" detalhe="Aguardando atendimento" />
            <IndicadorSite rotulo="Formulários" valor={numero(resumo.formularios)} icone={FileText} cor="amber" />
            <IndicadorSite rotulo="Cliques no WhatsApp" valor={numero(resumo.whatsapp)} icone={MessageCircle} cor="green" />
            <IndicadorSite rotulo="Conversão" valor={percentual(resumo.conversao_pct)} icone={MousePointerClick} cor="emerald" detalhe="Sessões com formulário" />
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-black/10 dark:border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"><PlugZap size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-zinc-900 dark:text-white">Sem dados de visitas ainda</p>
              <p className="text-sm text-zinc-500">Gere a chave, instale o script no site e use &quot;Testar conexão&quot;. Os indicadores aparecem com as primeiras visitas.</p>
            </div>
          </div>
        )
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {blocos.has("status") && <CartaoDoSite site={site} tenantId={tenantId} onAtualizar={onAtualizarSites} />}
        {blocos.has("licenca") && (
          estado.carregando ? <Esqueleto altura={340} /> :
          estado.gestao?.estado === "ok" ? <CartaoServicos servicos={estado.gestao.dados.servicos || []} siteId={site.id} onAbrirServicos={() => onIrPara("gestao")} /> : null
        )}
      </div>

      {blocos.has("oportunidades") && interacoes && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Bloco
            titulo="Central de oportunidades"
            icone={Target}
            cor="purple"
            className="lg:col-span-2"
            acao={<button type="button" onClick={() => onIrPara("interacoes")} className="text-[13px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">Ver todas</button>}
          >
            <UltimasInteracoes itens={interacoes.itens.slice(0, 6)} onAbrir={(id) => onIrPara("interacoes", id)} />
          </Bloco>
          <Bloco titulo="Aguardando atendimento" icone={CheckCircle2} cor="amber">
            <p className="text-4xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-white">{aguardando.length}</p>
            <p className="text-sm text-zinc-500 mt-1">{aguardando.length === 1 ? "contato novo sem responsável" : "contatos novos sem responsável"}</p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[["Telefone", Phone, resumo?.telefone], ["E-mail", Mail, resumo?.email], ["WhatsApp", MessageCircle, resumo?.whatsapp]].map(([rotulo, Icone, valor]) => (
                <div key={rotulo} className="rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] py-3">
                  <Icone size={15} className="mx-auto text-zinc-400" />
                  <p className="text-base font-bold tabular-nums mt-1">{numero(valor)}</p>
                  <p className="text-[11px] text-zinc-500">{rotulo}</p>
                </div>
              ))}
            </div>
          </Bloco>
        </div>
      )}
    </div>
  );
}
