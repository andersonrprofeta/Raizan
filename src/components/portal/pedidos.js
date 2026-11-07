// Como o portal traduz os status do pedido.

export const ETAPAS = ["Recebido", "Em separação", "Enviado", "Entregue"];

const STATUS = {
  "aguardando-pagamento": { rotulo: "Aguardando pagamento", tom: "alerta", etapa: 0, grupo: "aberto" },
  pending: { rotulo: "Aguardando pagamento", tom: "alerta", etapa: 0, grupo: "aberto" },
  "on-hold": { rotulo: "Em análise", tom: "alerta", etapa: 0, grupo: "aberto" },
  pago: { rotulo: "Pagamento aprovado", tom: "info", etapa: 0, grupo: "pago" },
  processing: { rotulo: "Em separação", tom: "info", etapa: 1, grupo: "aberto" },
  enviado: { rotulo: "Enviado", tom: "info", etapa: 2, grupo: "pago" },
  entregue: { rotulo: "Entregue", tom: "ok", etapa: 3, grupo: "pago" },
  completed: { rotulo: "Concluído", tom: "ok", etapa: 3, grupo: "pago" },
  cancelled: { rotulo: "Cancelado", tom: "neutro", etapa: -1, grupo: "cancelado" },
  cancelado: { rotulo: "Cancelado", tom: "neutro", etapa: -1, grupo: "cancelado" },
};

const pagaOnline = (metodo) => metodo === "pix" || metodo === "cartao";

// Status novo mostra o próprio nome, para nunca afirmar algo que o pedido não está
export function situacaoDoPedido(pedido) {
  const texto = String(pedido.status || "").toLowerCase().trim();
  const conhecido = STATUS[texto];
  if (!conhecido) return { rotulo: pedido.status || "Em andamento", tom: "info", etapa: 0, grupo: "aberto" };

  if (texto === "aguardando-pagamento" && !pagaOnline(pedido.payment_method)) {
    return { ...conhecido, rotulo: "Em análise" };
  }
  return conhecido;
}

export function lerMeta(pedido, chave) {
  return pedido.meta_data?.find((meta) => meta.key === chave)?.value || "";
}

export function rotuloDoPagamento(pedido, condicoes = []) {
  const metodo = pedido.payment_method;
  if (metodo === "pix") return "Pix";
  if (metodo === "cartao") return "Cartão";
  const condicao = condicoes.find((opcao) => String(opcao.codigo) === String(metodo));
  return condicao ? `Boleto · ${condicao.descricao}` : "Boleto";
}

export const totalDoItem = (item) => (item.total ? Number(item.total) : Number(item.price || 0) * Number(item.quantity || 1));
