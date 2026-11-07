// Conta única do preço no portal. A API confere o mesmo valor ao receber o pedido (services/precoPortal.js).

export function precoDoItem(item, quantidade = item.qtd || 0) {
  const normal = Number(item.preco_venda) || 0;
  const promocional = Number(item.preco_promocional) || 0;
  const minimo = parseInt(item.qtd_minima_promocao, 10) || 1;
  const temPromocao = promocional > 0;
  const atingiu = temPromocao && quantidade >= minimo;

  return {
    preco: atingiu ? promocional : normal,
    normal,
    promocional,
    minimo,
    temPromocao,
    atingiu,
    faltam: temPromocao ? Math.max(0, minimo - quantidade) : 0,
    desconto: temPromocao && normal > 0 ? Math.round((1 - promocional / normal) * 100) : 0,
  };
}

export function resumirCarrinho(carrinho) {
  const itens = Object.values(carrinho).map((item) => {
    const { preco, atingiu } = precoDoItem(item);
    return { ...item, precoUsado: preco, totalItem: preco * item.qtd, atingiuMinimo: atingiu };
  });

  return {
    itens,
    subtotal: itens.reduce((soma, item) => soma + item.totalItem, 0),
    unidades: itens.reduce((soma, item) => soma + item.qtd, 0),
  };
}

export function avaliarFrete(rota, subtotal) {
  const minimo = Number(rota?.valor_minimo) || 0;
  if (!minimo) return { temRegra: false, gratis: false };

  return {
    temRegra: true,
    gratis: subtotal >= minimo,
    minimo,
    falta: Math.max(0, minimo - subtotal),
    progresso: Math.min(1, subtotal / minimo),
    regiao: rota.nome,
  };
}
