"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Lock, ReceiptText } from "lucide-react";
import toast from "react-hot-toast";
import { nomeDoMes } from "@/components/vendedores/SeletorMes";
import { api, BOTAO_PRIMARIO, Carregando, EstadoVazio, Kpi, moeda, VIDRO } from "@/components/vendedores/ui";

const AVISO_BONIFICADOS = "Produtos bonificados não entram neste extrato.";

const escapar = (texto) => String(texto ?? "").replace(/[&<>"']/g, (letra) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[letra]));

function formatarDocumento(documento) {
  const n = String(documento || "");
  if (n.length === 14) return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (n.length === 11) return n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return n;
}

const lerEmpresa = () => {
  try {
    const usuario = JSON.parse(localStorage.getItem("@raizan:user") || "{}");
    return {
      nome: localStorage.getItem("@raizan:nome") || usuario.nome || "",
      cnpj: formatarDocumento(usuario.tenant_id),
      logo: localStorage.getItem("@raizan:logo") || "",
    };
  } catch (erro) {
    return { nome: "", cnpj: "", logo: "" };
  }
};

const ESTILO_DO_PDF = `
  @page { size: A4 portrait; margin: 14mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: "Segoe UI", -apple-system, Arial, sans-serif; color: #18181b; font-size: 12px; line-height: 1.45; }
  .topo { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-bottom: 14px; border-bottom: 3px solid #6d28d9; }
  .empresa { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .empresa img { width: 46px; height: 46px; object-fit: contain; border-radius: 10px; }
  .empresa strong { display: block; font-size: 15px; }
  .empresa span { color: #71717a; font-size: 11px; }
  .titulo { text-align: right; flex-shrink: 0; }
  .titulo h1 { margin: 0; font-size: 19px; letter-spacing: -0.3px; color: #4c1d95; }
  .titulo span { color: #71717a; font-size: 11px; }
  .dados { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 20px; margin: 16px 0; padding: 12px 14px; background: #f8f7fb; border-radius: 10px; }
  .dados small { display: block; color: #71717a; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; }
  .dados b { font-size: 12.5px; font-weight: 600; }
  .saldo { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 16px 18px; color: #fff; background: #4c1d95; border-radius: 12px; }
  .saldo span { font-size: 12px; opacity: .85; }
  .saldo strong { font-size: 24px; letter-spacing: -0.4px; }
  .resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .resumo div { padding: 10px 12px; border: 1px solid #e4e4e7; border-radius: 10px; }
  .resumo small { display: block; color: #71717a; font-size: 10px; }
  .resumo b { font-size: 14px; }
  h2 { margin: 20px 0 6px; font-size: 13px; color: #4c1d95; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead { display: table-header-group; }
  th { padding: 7px 8px; color: #52525b; font-size: 10px; font-weight: 600; text-align: right; text-transform: uppercase; letter-spacing: .3px; background: #f4f4f5; }
  td { padding: 7px 8px; text-align: right; border-bottom: 1px solid #ececf0; font-variant-numeric: tabular-nums; }
  th:first-child, td:first-child { text-align: left; }
  tr { break-inside: avoid; }
  td small { display: block; color: #71717a; font-size: 9.5px; }
  tfoot td { font-weight: 700; border-top: 2px solid #18181b; border-bottom: 0; }
  .rodape { margin-top: 24px; padding-top: 10px; color: #71717a; font-size: 9.5px; border-top: 1px solid #e4e4e7; }
`;

function montarHtmlDoPdf(extrato, vendedor, competencia) {
  const empresa = lerEmpresa();
  const { por_cliente: clientes, apuracao, ajustes, totais } = extrato;
  const emitido = new Date().toLocaleString("pt-BR");

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

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Extrato de comissão ${escapar(vendedor.nome)} ${escapar(nomeDoMes(competencia))}</title><style>${ESTILO_DO_PDF}</style></head><body>
    <header class="topo">
      <div class="empresa">
        ${empresa.logo ? `<img src="${escapar(empresa.logo)}" alt="">` : ""}
        <div><strong>${escapar(empresa.nome)}</strong><span>${empresa.cnpj ? `CNPJ ${escapar(empresa.cnpj)}` : ""}</span></div>
      </div>
      <div class="titulo"><h1>Extrato de comissão</h1><span>Emitido em ${escapar(emitido)}</span></div>
    </header>

    <section class="dados">
      <div><small>Vendedor</small><b>${escapar(vendedor.nome)}</b></div>
      <div><small>Competência</small><b>${escapar(nomeDoMes(competencia))}</b></div>
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

    ${secaoAjustes}

    <p class="rodape">${AVISO_BONIFICADOS} Documento gerado pelo Raizan Core.</p>
    <script>window.onload = function () { window.print(); };<\/script>
  </body></html>`;
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
    const janela = window.open("", "", "width=900,height=700");
    if (!janela) return toast.error("Libere as janelas do navegador para gerar o PDF.");
    janela.document.write(montarHtmlDoPdf(extrato, vendedor, competencia));
    janela.document.close();
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
