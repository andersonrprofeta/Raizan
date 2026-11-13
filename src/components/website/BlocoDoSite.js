"use client";

// Bloco "Meu site" para o painel inicial do Core (/resumo), nos três modelos de tela.
// Peça isolada: decide sozinha se aparece. Sem o módulo "website" ou sem a permissão, não renderiza
// nada e não chama a API. Qualquer falha da API também esconde o bloco: o painel nunca cai por causa dele.

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronRight, FileText, Globe, Inbox, MessageCircle, Receipt, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { temPermissao } from "@/components/utils/sessaoCore";
import { lerPainelDoSite, lerServicos } from "./dados";
import { Bloco, Esqueleto, Etiqueta, STATUS_CONEXAO, TOOLTIP_GRAFICO, Tile, dataCurta, numero } from "./comum";

const PERIODOS = [{ dias: 7, rotulo: "7 dias" }, { dias: 30, rotulo: "30 dias" }];

export function podeVerBlocoDoSite() {
  try {
    const modulos = JSON.parse(localStorage.getItem("@raizan:modulos") || "[]");
    return Array.isArray(modulos) && modulos.includes("website") && temPermissao("website");
  } catch (e) {
    return false;
  }
}

// Comparação com o período anterior de mesmo tamanho
function variacao(atual, anterior) {
  if (!anterior) return atual ? { texto: "novo", sobe: true } : null;
  const pct = Math.round(((atual - anterior) / anterior) * 100);
  if (pct === 0) return null;
  return { texto: `${pct > 0 ? "+" : ""}${pct}%`, sobe: pct > 0 };
}

function Numero({ icone, cor, rotulo, valor, anterior }) {
  const v = variacao(valor, anterior);
  return (
    <div className="min-w-0 rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-2">
        <Tile icone={icone} cor={cor} tamanho={30} />
        {v && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${v.sobe ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {v.sobe ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{v.texto}
          </span>
        )}
      </div>
      <p className="mt-3 text-[12px] leading-snug font-medium text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[2.1em] sm:min-h-0">{rotulo}</p>
      <p className="text-xl md:text-2xl font-bold tracking-tight tabular-nums text-zinc-900 dark:text-white">{numero(valor)}</p>
    </div>
  );
}

// Vencimento mais urgente dos serviços pagos à Raizan (só para quem cuida disso: website/gestao)
const PESO_DO_AVISO = { erro: 3, atencao: 2, info: 1 };
function AvisoDeVencimento() {
  const [alerta, setAlerta] = useState(null);
  useEffect(() => {
    if (!temPermissao("website/gestao")) return undefined;
    let cancelado = false;
    lerServicos().then((r) => {
      if (cancelado || r.estado !== "ok") return;
      const alertas = (r.dados.servicos || []).map((s) => s.alerta).filter(Boolean);
      alertas.sort((a, b) => (PESO_DO_AVISO[b.nivel] || 0) - (PESO_DO_AVISO[a.nivel] || 0));
      setAlerta(alertas[0] ? { ...alertas[0], mais: alertas.length - 1 } : null);
    });
    return () => { cancelado = true; };
  }, []);
  if (!alerta) return null;
  const cores = alerta.nivel === "erro"
    ? "bg-rose-500/[0.08] hover:bg-rose-500/[0.12] border-rose-500/20"
    : alerta.nivel === "atencao" ? "bg-amber-500/[0.08] hover:bg-amber-500/[0.12] border-amber-500/20" : "bg-purple-500/[0.06] hover:bg-purple-500/[0.1] border-purple-500/15";
  return (
    <Link href="/website?aba=gestao" className={`mb-5 flex items-center gap-3 rounded-2xl p-3.5 border transition-colors ${cores}`}>
      <Tile icone={Receipt} cor={alerta.nivel === "erro" ? "rose" : alerta.nivel === "atencao" ? "amber" : "purple"} tamanho={32} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-zinc-900 dark:text-white line-clamp-2">{alerta.texto}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{alerta.mais > 0 ? `E mais ${alerta.mais} aviso${alerta.mais > 1 ? "s" : ""} · ` : ""}Serviços e pagamentos</p>
      </div>
      <ChevronRight size={16} className="text-zinc-400 shrink-0" />
    </Link>
  );
}

export default function BlocoDoSite({ className = "" }) {
  const [ativo, setAtivo] = useState(false);
  const [dias, setDias] = useState(7);
  const [resposta, setResposta] = useState(null);

  useEffect(() => { setAtivo(podeVerBlocoDoSite()); }, []);

  useEffect(() => {
    if (!ativo) return undefined;
    let cancelado = false;
    setResposta(null);
    lerPainelDoSite(dias).then((r) => { if (!cancelado) setResposta(r); });
    return () => { cancelado = true; };
  }, [ativo, dias]);

  if (!ativo) return null;
  if (!resposta) return <Esqueleto altura={260} className={className} />;
  // API antiga, sem permissão ou erro: o resto do painel segue normal
  if (resposta.estado !== "ok") return null;

  const { sites = [], atual, anterior, por_dia: porDia = [], contatos } = resposta.dados;
  if (!sites.length) return null;

  const seletor = (
    <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.04] dark:bg-white/[0.05] shrink-0">
      {PERIODOS.map((p) => (
        <button
          key={p.dias}
          type="button"
          onClick={() => setDias(p.dias)}
          className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all ${dias === p.dias ? "bg-white dark:bg-white/[0.1] shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          {p.rotulo}
        </button>
      ))}
    </div>
  );

  return (
    <Bloco titulo="Meu site" icone={Globe} cor="emerald" acao={seletor} className={className}>
      <div className="flex flex-wrap items-center gap-2 -mt-2 mb-5">
        {sites.map((s) => {
          const status = STATUS_CONEXAO[s.status_conexao] || STATUS_CONEXAO.aguardando;
          return (
            <span key={s.id} className="inline-flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-300 min-w-0">
              <span className="truncate max-w-[180px]">{s.dominio}</span>
              <Etiqueta tom={status.tom} ponto>{status.rotulo}</Etiqueta>
            </span>
          );
        })}
      </div>

      <AvisoDeVencimento />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          <Numero icone={Globe} cor="emerald" rotulo="Visitas" valor={atual?.visitas || 0} anterior={anterior?.visitas || 0} />
          <Numero icone={Users} cor="blue" rotulo="Visitantes" valor={atual?.visitantes || 0} anterior={anterior?.visitantes || 0} />
          <Numero icone={FileText} cor="purple" rotulo="Formulários enviados" valor={atual?.formularios || 0} anterior={anterior?.formularios || 0} />
          <Numero icone={MessageCircle} cor="green" rotulo="WhatsApp, telefone e e-mail" valor={atual?.contatos_diretos || 0} anterior={anterior?.contatos_diretos || 0} />
        </div>

        <div className="lg:col-span-2 flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl bg-black/[0.025] dark:bg-white/[0.04] p-4 flex-1 min-h-[140px] min-w-0">
            <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 mb-2">Visitas por dia</p>
            <div style={{ height: 110 }} className="w-full min-w-0">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={porDia} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rz-site-visitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="data" hide />
                  <Tooltip contentStyle={TOOLTIP_GRAFICO} labelFormatter={(d) => dataCurta(`${d}T12:00:00`)} formatter={(v, nome) => [numero(v), nome === "visitas" ? "Visitas" : "Formulários"]} />
                  <Area type="monotone" dataKey="visitas" stroke="#10b981" strokeWidth={2} fill="url(#rz-site-visitas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* A API já não manda contatos sem a permissão de leads; a tela confere de novo */}
          {contatos && temPermissao("website/interacoes") && (
            <Link
              href="/website?aba=interacoes"
              className="flex items-center gap-3 rounded-2xl p-3.5 bg-purple-500/[0.08] hover:bg-purple-500/[0.12] border border-purple-500/15 transition-colors"
            >
              <Tile icone={Inbox} cor="purple" tamanho={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-white">
                  {contatos.novos === 1 ? "1 contato aguardando" : `${numero(contatos.novos)} contatos aguardando`}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {contatos.nao_lidos ? `${numero(contatos.nao_lidos)} ainda não abertos` : "Formulários do site"}
                </p>
              </div>
              <ChevronRight size={16} className="text-zinc-400 shrink-0" />
            </Link>
          )}
        </div>
      </div>

      <Link href="/website" className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">
        Abrir Meu site <ChevronRight size={14} />
      </Link>
    </Bloco>
  );
}
