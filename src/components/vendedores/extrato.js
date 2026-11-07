"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Lock, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import { nomeDoMes } from "@/components/vendedores/SeletorMes";
import { api, BOTAO_PRIMARIO, Carregando, EstadoVazio, Kpi, moeda, VIDRO } from "@/components/vendedores/ui";
import { abrirDocumento, escapar, formatarDocumento, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

const AVISO_BONIFICADOS = "Produtos bonificados não entram neste extrato.";

function montarHtmlDoPdf(extrato, vendedor, competencia) {
  const { por_cliente: clientes, apuracao, ajustes, totais } = extrato;
  const mes = nomeDoMes(competencia);

  const linhasClientes = clientes.map((c) => `<tr>
    <td>${escapar(c.cliente)}${c.documento ? `<small>${escapar(formatarDocumento(c.documento))}</small>` : ""}</td>
    <td>${c.pedidos}</td><td>${moeda(c.vendas)}</td><td>${moeda(c.devolucoes)}</td><td>${moeda(c.total)}</td>
  </tr>`).join("");

  const linhasMarcas = apuracao.map((m) => `<tr>
    <td>${escapar(m.marca)}</td><td>${moeda(m.base)}</td><td>${String(m.regra).replace(".", ",")}%</td><td>${moeda(m.comissao)}</td>
  </tr>`).join("");

  const secaoAjustes = ajustes.length === 0 ? "" : `<h2>Ajustes</h2><table>
    <thead><tr><th>Descrição</th><th>Valor</th></tr></thead>
    <tbody>${ajustes.map((a) => `<tr><td>${escapar(a.motivo || a.descricao || a.tipo)}</td><td>${moeda(a.valor)}</td></tr>`).join("")}</tbody>
  </table>`;

  const corpo = `
    <section class="dados">
      <div><small>Vendedor</small><b>${escapar(vendedor.nome)}</b></div>
      <div><small>Competência</small><b>${escapar(mes)}</b></div>
      <div><small>Situação</small><b>${extrato.fechado ? "Mês fechado" : "Mês em aberto"}</b></div>
    </section>

    <section class="saldo"><span>Comissão líquida do período</span><strong>${moeda(extrato.comissao_liquida)}</strong></section>

    <section class="resumo">
      <div><small>Vendas no período</small><b>${moeda(totais.vendas)}</b></div>
      <div><small>Comissão apurada</small><b>${moeda(extrato.comissao_original)}</b></div>
      <div><small>Ajustes</small><b>${moeda(extrato.total_ajustes)}</b></div>
    </section>

    <h2>Vendas por cliente</h2>
    <table>
      <thead><tr><th>Cliente</th><th>Pedidos</th><th>Vendas</th><th>Devoluções</th><th>Total</th></tr></thead>
      <tbody>${linhasClientes}</tbody>
      <tfoot><tr><td>Total</td><td>${totais.pedidos}</td><td>${moeda(totais.vendas)}</td><td>${moeda(totais.devolucoes)}</td><td>${moeda(totais.liquido)}</td></tr></tfoot>
    </table>

    <h2>Comissão por marca</h2>
    <table>
      <thead><tr><th>Marca</th><th>Base</th><th>Regra</th><th>Comissão</th></tr></thead>
      <tbody>${linhasMarcas}</tbody>
      <tfoot><tr><td>Total</td><td>${moeda(apuracao.reduce((acc, m) => acc + m.base, 0))}</td><td></td><td>${moeda(extrato.comissao_original)}</td></tr></tfoot>
    </table>

    ${secaoAjustes}`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Extrato de comissão",
    nomeDoArquivo: `Extrato de comissão ${vendedor.nome} ${mes}`,
    corpo,
    rodape: AVISO_BONIFICADOS,
  });
}

function TabelaExtrato({ titulo, colunas, children, rodape }) {
  return (
    <section className={`${VIDRO} overflow-hidden`}>
      <h2 className="border-b border-black/[0.05] px-5 py-4 font-semibold tracking-tight dark:border-white/[0.06]">{titulo}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm tabular-nums">
          <thead>
            <tr className="border-b border-black/[0.05] text-xs text-zinc-500 dark:border-white/[0.06]">
              {colunas.map((coluna, indice) => <th key={coluna} className={`px-5 py-3 font-medium ${indice === 0 ? "text-left" : "text-right"}`}>{coluna}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.05]">{children}</tbody>
          <tfoot><tr className="border-t border-black/[0.08] font-semibold dark:border-white/[0.1]">{rodape}</tr></tfoot>
        </table>
      </div>
    </section>
  );
}

const Celula = ({ children, esquerda = false, forte = false }) => (
  <td className={`px-5 py-3 ${esquerda ? "text-left" : "text-right"} ${forte ? "font-semibold" : ""}`}>{children}</td>
);

export default function ExtratoComissao({ vendedor, competencia }) {
  const { mes, ano } = competencia;
  const [extrato, setExtrato] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await api(`/comissoes/extrato?vendedor_id=${vendedor.id}&mes=${mes}&ano=${ano}`);
      setExtrato(dados.success ? dados : null);
      if (!dados.success) toast.error(dados.message || "Erro ao carregar o extrato.");
    } catch (erro) {
      setExtrato(null);
      toast.error("Erro de conexão ao carregar o extrato.");
    } finally {
      setCarregando(false);
    }
  }, [vendedor.id, mes, ano]);

  useEffect(() => { carregar(); }, [carregar]);

  const baixarPdf = () => {
    if (!abrirDocumento(montarHtmlDoPdf(extrato, vendedor, competencia))) toast.error("Libere as janelas do navegador para gerar o PDF.");
  };

  if (carregando && !extrato) return <Carregando />;
  if (!extrato) return <EstadoVazio icone={ReceiptText} titulo="Extrato indisponível" texto="Não foi possível carregar este mês." />;

  const { por_cliente: clientes, apuracao, totais } = extrato;
  const semMovimento = clientes.length === 0 && apuracao.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{nomeDoMes(competencia)}. {AVISO_BONIFICADOS}</p>
        <button type="button" onClick={baixarPdf} disabled={semMovimento} className={`${BOTAO_PRIMARIO} shrink-0 disabled:opacity-50`}>
          <FileText size={16} /> Gerar PDF
        </button>
      </div>

      <div className={`grid grid-cols-2 gap-4 transition-opacity lg:grid-cols-4 ${carregando ? "opacity-50" : ""}`}>
        <Kpi rotulo="Comissão líquida" valor={moeda(extrato.comissao_liquida)} tom="text-purple-600 dark:text-purple-400" detalhe={extrato.fechado ? "Mês fechado" : "Mês em aberto"} />
        <Kpi rotulo="Vendas" valor={moeda(totais.vendas)} detalhe={`${totais.pedidos} ${totais.pedidos === 1 ? "pedido" : "pedidos"}`} />
        <Kpi rotulo="Clientes" valor={String(clientes.length)} />
        <Kpi rotulo="Ajustes" valor={moeda(extrato.total_ajustes)} />
      </div>

      {extrato.congelado && (
        <div className="flex items-start gap-3 rounded-2xl bg-black/[0.04] px-5 py-3.5 text-sm text-zinc-600 dark:bg-white/[0.05] dark:text-zinc-300">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <p>A comissão por marca está congelada no fechamento. As vendas por cliente são lidas dos pedidos atuais.</p>
        </div>
      )}

      {semMovimento ? (
        <EstadoVazio icone={ReceiptText} titulo="Sem movimento" texto="Este vendedor não tem vendas faturadas neste mês." />
      ) : (
        <>
          <TabelaExtrato
            titulo="Vendas por cliente"
            colunas={["Cliente", "Pedidos", "Vendas", "Devoluções", "Total"]}
            rodape={<><Celula esquerda>Total</Celula><Celula>{totais.pedidos}</Celula><Celula>{moeda(totais.vendas)}</Celula><Celula>{moeda(totais.devolucoes)}</Celula><Celula>{moeda(totais.liquido)}</Celula></>}
          >
            {clientes.map((cliente, indice) => (
              <tr key={`${cliente.documento}-${indice}`}>
                <Celula esquerda>
                  <span className="block font-medium">{cliente.cliente}</span>
                  {cliente.documento && <span className="block text-xs text-zinc-500">{formatarDocumento(cliente.documento)}</span>}
                </Celula>
                <Celula>{cliente.pedidos}</Celula>
                <Celula>{moeda(cliente.vendas)}</Celula>
                <Celula>{cliente.devolucoes > 0 ? moeda(cliente.devolucoes) : "—"}</Celula>
                <Celula forte>{moeda(cliente.total)}</Celula>
              </tr>
            ))}
          </TabelaExtrato>

          <TabelaExtrato
            titulo="Comissão por marca"
            colunas={["Marca", "Base", "Regra", "Comissão"]}
            rodape={<><Celula esquerda>Total</Celula><Celula>{moeda(apuracao.reduce((acc, m) => acc + m.base, 0))}</Celula><Celula>—</Celula><Celula>{moeda(extrato.comissao_original)}</Celula></>}
          >
            {apuracao.map((marca) => (
              <tr key={marca.marca}>
                <Celula esquerda><span className="font-medium">{marca.marca}</span></Celula>
                <Celula>{moeda(marca.base)}</Celula>
                <Celula>{String(marca.regra).replace(".", ",")}%</Celula>
                <Celula forte>{moeda(marca.comissao)}</Celula>
              </tr>
            ))}
          </TabelaExtrato>
        </>
      )}
    </div>
  );
}
