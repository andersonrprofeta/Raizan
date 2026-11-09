// Regras de busca usadas pela lista de produtos e pelas sugestões do topo: as duas acham sempre a mesma coisa.
// A busca em si é a "busca inteligente", igual em todos os canais (src/lib/buscaInteligente.js).
import { combinaComBusca, pontuarProduto } from "@/lib/buscaInteligente";

export const semAcento = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export const codigoExato = (produto, busca) => Boolean(busca) && (semAcento(produto.sku) === busca || semAcento(produto.gtin) === busca);

export const combina = (produto, busca) => !busca || combinaComBusca(produto, busca);

// Quando o lojista escolheu uma ordem (preço, nome): só código exato primeiro e quem não tem estoque por último
export const pesoNaBusca = (produto, busca) => (codigoExato(produto, busca) ? 2 : 0) + (produto.estoque_inicial > 0 ? 1 : 0);

// Ordem "Padrão" com busca: o mais parecido com o que foi digitado primeiro (nome antes de descrição)
export const notaNaBusca = (produto, busca) => (busca ? pontuarProduto(produto, busca) : 0) + (produto.estoque_inicial > 0 ? 0.5 : 0);
