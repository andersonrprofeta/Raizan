// Mapa de conferência cega de uma entrada de mercadoria.
//
// Cego de propósito: nenhuma quantidade pedida ou valor sai impresso. O conferente conta e escreve.
// Primeira versão limpa, na base visual de todo PDF do Raizan. O layout final virá do PDF de referência.

import { escapar, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

const ESTILO_DO_MAPA = `
  <style>
    .mapa td.escrever { width: 110px; border-bottom: 1px solid #a1a1aa; }
    .mapa td.codigo { font-family: Consolas, "Courier New", monospace; font-size: 10.5px; text-align: left; white-space: nowrap; }
    .mapa td.numero { width: 26px; color: #a1a1aa; text-align: left; }
    .mapa tr { height: 30px; }
    .assinaturas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 36px; }
    .assinaturas div { padding-top: 6px; border-top: 1px solid #18181b; font-size: 10.5px; color: #52525b; text-align: center; }
    .aviso { margin: 14px 0 0; padding: 10px 12px; border: 1px dashed #c4b5fd; border-radius: 10px; color: #4c1d95; font-size: 11px; }
    .linhas-extras td { height: 30px; }
  </style>`;

const LINHAS_EM_BRANCO = 5;

export function montarMapaDeConferencia({ compra, itens }) {
  const linhas = itens.map((item, posicao) => `<tr>
    <td class="numero">${posicao + 1}</td>
    <td>${escapar(item.descricao)}${item.unidade_medida ? `<small>${escapar(item.unidade_medida)}</small>` : ""}</td>
    <td class="codigo">${escapar(item.sku || "")}</td>
    <td class="codigo">${escapar(item.ean || "")}</td>
    <td class="escrever"></td>
    <td class="escrever"></td>
  </tr>`).join("");

  const brancos = Array.from({ length: LINHAS_EM_BRANCO }, () => `<tr><td class="numero"></td><td></td><td></td><td></td><td class="escrever"></td><td class="escrever"></td></tr>`).join("");

  const corpo = `${ESTILO_DO_MAPA}
    <section class="dados">
      <div><small>Pedido de compra</small><b>${escapar(compra.pedido_compra)}</b></div>
      <div><small>Fornecedor</small><b>${escapar(compra.fornecedor_nome || "Não informado")}</b></div>
      <div><small>Previsão de chegada</small><b>${escapar(compra.data_prevista ? compra.data_prevista.split("-").reverse().join("/") : "Não informada")}</b></div>
      <div><small>Centro de distribuição</small><b>${escapar(compra.centro_distribuicao || "Principal")}</b></div>
      <div><small>Nota fiscal</small><b>______________________</b></div>
      <div><small>Itens</small><b>${itens.length}</b></div>
    </section>

    <table class="mapa">
      <thead><tr><th>#</th><th>Produto</th><th>SKU</th><th>EAN</th><th>Quantidade contada</th><th>Lote / validade</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>

    <h2>Produtos que chegaram e não estão na lista</h2>
    <table class="mapa linhas-extras">
      <thead><tr><th>#</th><th>Produto</th><th>SKU</th><th>EAN</th><th>Quantidade contada</th><th>Lote / validade</th></tr></thead>
      <tbody>${brancos}</tbody>
    </table>

    <p class="aviso">Conferência cega: conte tudo o que chegou, sem consultar a nota. A comparação com o pedido é feita pelo Raizan.</p>

    <div class="assinaturas">
      <div>Conferente</div>
      <div>Data e hora</div>
      <div>Responsável pelo recebimento</div>
    </div>`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Mapa de conferência cega",
    nomeDoArquivo: `Mapa de conferência ${compra.pedido_compra}`,
    corpo,
  });
}
