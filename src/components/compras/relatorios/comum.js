"use client";

// Peças comuns dos relatórios de compras: tabela com colunas declaradas, exportar CSV e imprimir no PDF do Raizan.

import { Fragment, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Download, Printer } from "lucide-react";
import toast from "react-hot-toast";
import { BOTAO_SECUNDARIO, moeda } from "@/components/vendedores/ui";
import { diaCurto, quantidade } from "@/components/compras/ui";
import { abrirDocumento, escapar, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

// Formatos de célula. A coluna declara o tipo; tela, CSV e PDF usam o mesmo formato.
const FORMATOS = {
  texto: (v) => (v === null || v === undefined || v === "" ? "—" : String(v)),
  moeda: (v) => (v === null || v === undefined ? "—" : moeda(v)),
  qtd: (v) => quantidade(v),
  dia: (v) => (v ? diaCurto(v) : "—"),
  pct: (v) => (v === null || v === undefined ? "—" : `${Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`),
  dias: (v) => (v === null || v === undefined ? "—" : `${v} ${v === 1 ? "dia" : "dias"}`),
};
export const formatar = (coluna, linha) => {
  const valor = typeof coluna.valor === "function" ? coluna.valor(linha) : linha[coluna.chave];
  return (FORMATOS[coluna.tipo] || FORMATOS.texto)(valor);
};
const valorBruto = (coluna, linha) => (typeof coluna.valor === "function" ? coluna.valor(linha) : linha[coluna.chave]);
const aDireita = (coluna) => ["moeda", "qtd", "pct", "dias"].includes(coluna.tipo);

// CSV com ; (abre direto no Excel em português)
export function exportarCsv(nome, colunas, linhas) {
  const celula = (texto) => `"${String(texto ?? "").replace(/"/g, '""')}"`;
  const bruto = (coluna, linha) => {
    const v = valorBruto(coluna, linha);
    if (typeof v === "number") return String(v).replace(".", ",");
    return coluna.tipo === "dia" && v ? diaCurto(v) : v;
  };
  const conteudo = [colunas.map((c) => celula(c.rotulo)).join(";"), ...linhas.map((l) => colunas.map((c) => celula(bruto(c, l))).join(";"))].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([`﻿${conteudo}`], { type: "text/csv;charset=utf-8" }));
  link.download = `${nome}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function imprimirRelatorio({ titulo, subtitulo, resumo = [], colunas, linhas }) {
  const corpo = `
    ${subtitulo ? `<p style="margin:0 0 10px;color:#52525b;font-size:11px">${escapar(subtitulo)}</p>` : ""}
    ${resumo.length ? `<section class="dados">${resumo.map(([rotulo, valor]) => `<div><small>${escapar(rotulo)}</small><b>${escapar(valor)}</b></div>`).join("")}</section>` : ""}
    <table><thead><tr>${colunas.map((c) => `<th style="text-align:${aDireita(c) ? "right" : "left"}">${escapar(c.rotulo)}</th>`).join("")}</tr></thead>
    <tbody>${linhas.map((l) => `<tr>${colunas.map((c) => `<td style="text-align:${aDireita(c) ? "right" : "left"}">${escapar(formatar(c, l))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const html = montarDocumento({ empresa: lerEmpresa(), titulo, nomeDoArquivo: titulo, corpo, rodape: `${linhas.length} ${linhas.length === 1 ? "linha" : "linhas"}.` });
  if (!abrirDocumento(html)) toast.error("Libere as janelas do navegador para imprimir.");
}

export function BotoesDeSaida({ nome, titulo, subtitulo, resumo, colunas, linhas }) {
  const paraSaida = colunas.filter((c) => !c.soTela);
  return (
    <div className="flex gap-2">
      <button type="button" disabled={!linhas.length} onClick={() => exportarCsv(nome, paraSaida, linhas)} className={`${BOTAO_SECUNDARIO} h-10`}><Download size={15} />Planilha</button>
      <button type="button" disabled={!linhas.length} onClick={() => imprimirRelatorio({ titulo, subtitulo, resumo, colunas: paraSaida.filter((c) => !c.soPlanilha), linhas })} className={`${BOTAO_SECUNDARIO} h-10`}><Printer size={15} />Imprimir</button>
    </div>
  );
}

// Tabela com ordenação por coluna. detalhe(linha) desenha uma linha extra embaixo, quando aberta.
export function TabelaRelatorio({ colunas, linhas, chave = (l, i) => i, detalhe, vazio = "Nada para mostrar neste período.", ordemInicial }) {
  const [ordem, setOrdem] = useState(ordemInicial || null);
  const [aberta, setAberta] = useState(null);
  const visiveis = colunas.filter((c) => !c.soPlanilha);

  const ordenadas = useMemo(() => {
    if (!ordem) return linhas;
    const coluna = colunas.find((c) => c.chave === ordem.chave);
    if (!coluna) return linhas;
    return [...linhas].sort((a, b) => {
      const va = valorBruto(coluna, a);
      const vb = valorBruto(coluna, b);
      if (va === vb) return 0;
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const comparacao = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR");
      return ordem.direcao === "asc" ? comparacao : -comparacao;
    });
  }, [linhas, ordem, colunas]);

  if (!linhas.length) return <p className="px-6 py-14 text-center text-sm text-zinc-500">{vazio}</p>;

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-zinc-500 bg-black/[0.02] dark:bg-white/[0.03]">
            {visiveis.map((c) => (
              <th key={c.chave} className={`font-semibold px-3 first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6 py-2.5 whitespace-nowrap ${aDireita(c) ? "text-right" : "text-left"}`}>
                {c.ordenavel === false ? c.rotulo : (
                  <button type="button" onClick={() => setOrdem((atual) => ({ chave: c.chave, direcao: atual?.chave === c.chave && atual.direcao === "desc" ? "asc" : "desc" }))} className="inline-flex items-center gap-1 uppercase hover:text-zinc-900 dark:hover:text-white">
                    {c.rotulo}
                    {ordem?.chave === c.chave && (ordem.direcao === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {ordenadas.map((linha, indice) => {
            const id = chave(linha, indice);
            return (
              <Fragment key={id}>
                <tr onClick={detalhe ? () => setAberta(aberta === id ? null : id) : undefined} className={`${detalhe ? "cursor-pointer" : ""} hover:bg-black/[0.02] dark:hover:bg-white/[0.03] ${aberta === id ? "bg-purple-500/[0.04]" : ""}`}>
                  {visiveis.map((c) => (
                    <td key={c.chave} className={`px-3 first:pl-5 sm:first:pl-6 last:pr-5 sm:last:pr-6 py-2.5 ${aDireita(c) ? "text-right tabular-nums whitespace-nowrap" : ""} ${c.classe || ""}`}>
                      {c.render ? c.render(linha) : formatar(c, linha)}
                    </td>
                  ))}
                </tr>
                {detalhe && aberta === id && (
                  <tr><td colSpan={visiveis.length} className="px-5 sm:px-6 pb-4 pt-1 bg-purple-500/[0.04]">{detalhe(linha)}</td></tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Pilula({ classe, children }) {
  return <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${classe}`}>{children}</span>;
}
