// Regras de busca usadas pela lista de produtos e pelas sugestões do topo: as duas acham sempre a mesma coisa.

export const semAcento = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const codigoExato = (produto, busca) => Boolean(busca) && (semAcento(produto.sku) === busca || semAcento(produto.gtin) === busca);

export const combina = (produto, busca) => !busca || [produto.nome, produto.sku, produto.gtin, produto.marca].some((campo) => semAcento(campo).includes(busca));

// Código exato primeiro; quem não tem estoque por último
export const pesoNaBusca = (produto, busca) => (codigoExato(produto, busca) ? 2 : 0) + (produto.estoque_inicial > 0 ? 1 : 0);
