// Mapa de entrada de produtos: relação impressa para a conferência física (conferência cega).
//
// Cego de propósito: nenhuma quantidade esperada ou valor sai impresso. Para cada produto o conferente
// preenche à mão quantidade, vencimento e lote (linha extra para um segundo lote), e assina no fim.
// Compacto de propósito: pedido grande não pode virar uma pilha de folhas.
// Base visual: a mesma de todo PDF do Raizan (montarDocumento).

import { escapar, lerEmpresa, montarDocumento } from "@/components/utils/documentoPdf";

const LINHAS_POR_PRODUTO = 2;

const ESTILO_DO_MAPA = `
  <style>
    .mapa { margin-top: 4px; }
    .mapa th { text-align: left; }
    .mapa th.qtd, .mapa td.qtd { width: 70px; text-align: center; }
    .mapa th.preencher, .mapa td.preencher { width: 110px; }
    .mapa th, .mapa td { padding-left: 6px; padding-right: 6px; }
    .mapa td { text-align: left; vertical-align: bottom; padding-top: 3px; padding-bottom: 2px; font-size: 11px; line-height: 1.25; }
    .mapa tbody { break-inside: avoid; }
    .mapa tbody tr td { border-bottom: 0; }
    .mapa tbody tr:last-child td { border-bottom: 1px solid #ececf0; padding-bottom: 4px; }
    .mapa td.produto { font-weight: 600; }
    .mapa td.codigo { font-family: Consolas, "Courier New", monospace; font-size: 10.5px; white-space: nowrap; }
    .linha { display: block; height: 15px; border-bottom: 1px solid #a1a1aa; }
    .assinatura { display: flex; justify-content: flex-end; margin-top: 44px; break-inside: avoid; }
    .assinatura div { width: 300px; padding-top: 6px; border-top: 1px solid #18181b; text-align: center; font-size: 10.5px; letter-spacing: .6px; color: #52525b; text-transform: uppercase; }
  </style>`;

function blocoDoProduto(item) {
  const linhas = Array.from({ length: LINHAS_POR_PRODUTO }, (_, posicao) => `<tr>
      ${posicao === 0
        ? `<td class="produto">${escapar(item.descricao)}</td><td>${escapar(item.unidade || "")}</td><td>${escapar(item.fabricante || "")}</td><td class="codigo">${escapar(item.sku || "")}</td>`
        : "<td></td><td></td><td></td><td></td>"}
      <td class="qtd"><span class="linha"></span></td>
      <td class="preencher"><span class="linha"></span></td>
      <td class="preencher"><span class="linha"></span></td>
    </tr>`).join("");
  return `<tbody>${linhas}</tbody>`;
}

// documento: o pedido ou a NF-e aberta. vinculados: os documentos ligados a ele (pedido da nota, nota do pedido).
export function montarMapaDeEntrada({ documento, itens, vinculados = [] }) {
  const pedido = documento.tipo_documento === "pedido" ? documento : vinculados.find((v) => v.tipo_documento === "pedido");
  const nota = documento.tipo_documento === "nfe" ? documento : vinculados.find((v) => v.tipo_documento === "nfe");
  const fornecedor = documento.fornecedor || "Não informado";

  const corpo = `${ESTILO_DO_MAPA}
    <section class="dados">
      <div><small>Pedido de compra</small><b>${escapar(pedido?.numero_documento || "Não informado")}</b></div>
      <div><small>Nº NF-e</small><b>${escapar(nota ? `${nota.numero_documento || "s/n"}${nota.serie ? ` série ${nota.serie}` : ""}` : "______________")}</b></div>
      <div><small>Produtos</small><b>${itens.length}</b></div>
      <div style="grid-column: span 3"><small>Fornecedor</small><b>${escapar(fornecedor)}</b></div>
    </section>

    <table class="mapa">
      <thead><tr><th>Descrição</th><th>Und</th><th>Marca</th><th>SKU</th><th class="qtd">Qtd</th><th class="preencher">Vencimento</th><th class="preencher">Lote</th></tr></thead>
      ${itens.map(blocoDoProduto).join("")}
    </table>

    <div class="assinatura"><div>Conferente</div></div>`;

  return montarDocumento({
    empresa: lerEmpresa(),
    titulo: "Mapa de entrada de produtos",
    nomeDoArquivo: `Mapa de entrada ${pedido?.numero_documento || nota?.numero_documento || ""}`.trim(),
    corpo,
    rodape: "Conferência física: preencha o que chegou, sem consultar a nota.",
  });
}
