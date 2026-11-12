"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarClock, CreditCard, Globe, History, Receipt, Server, ShieldCheck, Wallet } from "lucide-react";
import { BOTAO_PRIMARIO, EstadoVazio, VIDRO, moeda } from "@/components/vendedores/ui";
import { lerGestao } from "./dados";
import { Bloco, Esqueleto, EstadoDaFonte, Etiqueta, STATUS_LICENCA, Tile, dataHora, dataLonga, diasAte } from "./comum";

const STATUS_PAGAMENTO = {
  aprovado: { rotulo: "Pago", tom: "verde" },
  pendente: { rotulo: "Pendente", tom: "ambar" },
  recusado: { rotulo: "Recusado", tom: "vermelho" },
  estornado: { rotulo: "Estornado", tom: "cinza" },
};

// Licença, domínio e hospedagem vencem em datas diferentes e são renovados de formas diferentes
function Vencimento({ titulo, icone, cor, data, texto }) {
  const dias = diasAte(data);
  let tom = "verde";
  let situacao = dias === null ? "Não cadastrado" : dias < 0 ? `Venceu há ${-dias} ${dias === -1 ? "dia" : "dias"}` : dias === 0 ? "Vence hoje" : `Faltam ${dias} ${dias === 1 ? "dia" : "dias"}`;
  if (dias === null) tom = "cinza";
  else if (dias < 0) tom = "vermelho";
  else if (dias <= 15) tom = "ambar";

  return (
    <div className={`${VIDRO} p-5 min-w-0`}>
      <div className="flex items-start justify-between gap-3">
        <Tile icone={icone} cor={cor} tamanho={38} />
        <Etiqueta tom={tom} ponto>{situacao}</Etiqueta>
      </div>
      <p className="mt-4 text-[13px] font-medium text-zinc-500">{titulo}</p>
      <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">{dataLonga(data)}</p>
      <p className="text-xs text-zinc-500 mt-1.5">{texto}</p>
    </div>
  );
}

function Linha({ rotulo, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-black/[0.05] dark:border-white/[0.05] last:border-0">
      <span className="text-[13px] text-zinc-500 shrink-0">{rotulo}</span>
      <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 text-right min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function Gestao({ siteId }) {
  const [resposta, setResposta] = useState(null);

  const carregar = useCallback(async () => {
    setResposta(null);
    setResposta(await lerGestao({ site_id: siteId }));
  }, [siteId]);

  useEffect(() => { carregar(); }, [carregar]);

  if (!resposta) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Esqueleto key={i} altura={170} />)}</div>;
  }
  if (resposta.estado !== "ok") return <div className={VIDRO}><EstadoDaFonte resposta={resposta} onTentar={carregar} titulo="Gestão do site ainda não ativada" /></div>;

  const g = resposta.dados.gestao;
  if (!g) {
    return <div className={VIDRO}><EstadoVazio icone={ShieldCheck} titulo="Sem cadastro de gestão" texto="A equipe Raizan ainda não cadastrou licença, domínio e hospedagem deste site." /></div>;
  }

  const status = STATUS_LICENCA[g.status_licenca] || STATUS_LICENCA.active;
  const emCarencia = g.status_licenca === "grace_period" || g.status_licenca === "overdue";
  const diasVencida = -(diasAte(g.licenca_vence) ?? 0);
  const restamCarencia = Math.max(0, (g.carencia_dias || 20) - diasVencida);

  return (
    <div className="space-y-6">
      {emCarencia && (
        <div className="rounded-[24px] border border-amber-500/25 bg-amber-500/[0.08] p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <CalendarClock size={22} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-zinc-900 dark:text-white">Pagamento da licença pendente</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {restamCarencia > 0
                ? `O site continua no ar por mais ${restamCarencia} ${restamCarencia === 1 ? "dia" : "dias"} de carência. Regularize para evitar a suspensão.`
                : "O prazo de carência terminou. Fale com a equipe Raizan para regularizar."}
            </p>
          </div>
          {g.link_pagamento && <a href={g.link_pagamento} target="_blank" rel="noopener noreferrer" className={BOTAO_PRIMARIO}><CreditCard size={16} /> Pagar agora</a>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Vencimento titulo="Licença do serviço" icone={ShieldCheck} cor="purple" data={g.licenca_vence} texto="Renovada pelo pagamento do plano Raizan." />
        <Vencimento titulo="Domínio" icone={Globe} cor="sky" data={g.dominio_vence} texto="Renovado no registrador. Não é renovado pelo plano." />
        <Vencimento titulo="Hospedagem" icone={Server} cor="indigo" data={g.hospedagem_vence} texto="Contrato próprio da hospedagem, separado do domínio." />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <Bloco titulo="Dados do projeto" icone={ShieldCheck} cor="emerald" acao={<Etiqueta tom={status.tom} ponto>{status.rotulo}</Etiqueta>}>
          <Linha rotulo="Projeto">{g.projeto}</Linha>
          <Linha rotulo="Domínio principal">{g.dominio}</Linha>
          {g.dominios_adicionais?.length > 0 && <Linha rotulo="Domínios adicionais">{g.dominios_adicionais.join(", ")}</Linha>}
          <Linha rotulo="Status do site">{g.status_site === "publicado" ? "Publicado" : g.status_site === "suspenso" ? "Suspenso" : "Em construção"}</Linha>
          <Linha rotulo="Publicado em">{dataLonga(g.publicado_em)}</Linha>
          <Linha rotulo="HTTPS">{g.https === null || g.https === undefined ? "Não verificado" : g.https ? "Ativo" : "Inativo"}</Linha>
          <Linha rotulo="Hospedagem">{g.hospedagem || "Não informada"}</Linha>
        </Bloco>

        <Bloco titulo="Financeiro do meu site" icone={Wallet} cor="amber">
          <Linha rotulo="Plano">{g.plano || "—"}</Linha>
          <Linha rotulo="Valor">{g.valor ? `${moeda(g.valor)}${g.ciclo ? ` / ${g.ciclo === "anual" ? "ano" : "mês"}` : ""}` : "—"}</Linha>
          <Linha rotulo="Próximo pagamento">{dataLonga(g.proximo_pagamento)}</Linha>
          <Linha rotulo="Situação">{g.situacao_financeira || "—"}</Linha>
          <Linha rotulo="Carência após vencimento">{g.carencia_dias || 20} dias</Linha>
          {!emCarencia && g.link_pagamento && (
            <a href={g.link_pagamento} target="_blank" rel="noopener noreferrer" className={`${BOTAO_PRIMARIO} w-full mt-4`}><CreditCard size={16} /> Pagar agora</a>
          )}
        </Bloco>

        <Bloco titulo="Histórico de alterações" icone={History} cor="indigo">
          {g.alteracoes?.length ? (
            <ol className="relative border-l border-black/[0.08] dark:border-white/[0.08] ml-1.5 space-y-3">
              {g.alteracoes.map((a, i) => (
                <li key={i} className="pl-4 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                  <p className="text-[13px] text-zinc-800 dark:text-zinc-200">{a.acao}</p>
                  <p className="text-[11px] text-zinc-500">{a.quem} · {dataHora(a.quando)}</p>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-zinc-400">Nenhuma alteração registrada.</p>}
        </Bloco>
      </div>

      <Bloco titulo="Histórico de pagamentos" icone={Receipt} cor="emerald">
        {g.pagamentos?.length ? (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-[12px] text-zinc-500">
                  <th className="font-medium px-2 pb-3">Referência</th>
                  <th className="font-medium px-2 pb-3">Valor</th>
                  <th className="font-medium px-2 pb-3">Pago em</th>
                  <th className="font-medium px-2 pb-3">Meio</th>
                  <th className="font-medium px-2 pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
                {g.pagamentos.map((p) => {
                  const st = STATUS_PAGAMENTO[p.status] || STATUS_PAGAMENTO.pendente;
                  return (
                    <tr key={p.id}>
                      <td className="px-2 py-3 font-medium">{p.referencia}</td>
                      <td className="px-2 py-3 tabular-nums">{moeda(p.valor)}</td>
                      <td className="px-2 py-3">{dataLonga(p.pago_em)}</td>
                      <td className="px-2 py-3">{p.meio || "—"}</td>
                      <td className="px-2 py-3 text-right"><Etiqueta tom={st.tom}>{st.rotulo}</Etiqueta></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-zinc-400">Nenhum pagamento registrado ainda.</p>}
      </Bloco>
    </div>
  );
}
