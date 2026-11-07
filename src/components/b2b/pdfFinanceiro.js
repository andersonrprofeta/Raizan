import { escapar, lerEmpresaDoPortal, montarDocumento } from "@/components/utils/documentoPdf";

const CLASSE_DO_STATUS = { pago: "positivo", cancelado: "apagado", aberto: "alerta" };

export function montarPdfFinanceiro({ cliente, periodo, pedidos, totalPago, totalDevedor, pedidosPagos, pedidosEmAberto, situacaoDoPedido, format }) {
  const linhas = pedidos.map((pedido) => {
    const classe = CLASSE_DO_STATUS[situacaoDoPedido(pedido)];
    return `<tr>
      <td><strong>#${escapar(pedido.id)}</strong></td>
      <td>${new Date(pedido.date_created).toLocaleDateString("pt-BR")}</td>
      <td class="${classe}">${escapar(String(pedido.status).replace("-", " "))}</td>
      <td${classe === "apagado" ? ' class="apagado"' : ""}>${format(pedido.total)}</td>
    </tr>`;
  }).join("");

  const corpo = `
    <section class="dados">
      <div><small>Cliente</small><b>${escapar(cliente)}</b></div>
      <div><small>Período</small><b>Últimos ${escapar(periodo)} dias</b></div>
      <div><small>Pedidos</small><b>${pedidosPagos + pedidosEmAberto}</b></div>
    </section>

    <section class="saldo"><span>Títulos pendentes</span><strong>${format(totalDevedor)}</strong></section>

    <section class="resumo">
      <div><small>Total faturado</small><b>${format(totalPago)}</b></div>
      <div><small>Pedidos pagos</small><b>${pedidosPagos}</b></div>
      <div><small>Pedidos em aberto</small><b>${pedidosEmAberto}</b></div>
    </section>

    <h2>Histórico de movimentações</h2>
    <table>
      <thead><tr><th>Pedido</th><th>Data</th><th>Status</th><th>Valor</th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="4" class="vazio">Nenhuma movimentação encontrada.</td></tr>'}</tbody>
    </table>`;

  return montarDocumento({
    empresa: lerEmpresaDoPortal(),
    titulo: "Extrato financeiro",
    nomeDoArquivo: `Extrato financeiro ${cliente}`,
    corpo,
  });
}
