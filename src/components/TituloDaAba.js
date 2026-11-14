"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Nome de cada tela na aba do navegador. A rota mais específica vem primeiro.
const TELAS_DO_PAINEL = [
  ["/login", "Entrar"],
  ["/resumo", "Painel"],
  ["/pedidos", "Pedidos"],
  ["/editar-pedido", "Editar pedido"],
  ["/checkout/historico", "Histórico do checkout"],
  ["/checkout/scanner", "Scanner do checkout"],
  ["/checkout", "Checkout"],
  ["/pdv", "PDV"],
  ["/cadastros/clientes/novo", "Novo cliente"],
  ["/cadastros/clientes/editar", "Editar cliente"],
  ["/cadastros/clientes/detalhes", "Cliente"],
  ["/cadastros/clientes", "Clientes"],
  ["/cadastros/produtos/novo", "Novo produto"],
  ["/cadastros/produtos/editar", "Editar produto"],
  ["/cadastros/produtos", "Produtos"],
  ["/cadastros/vendedores/detalhes", "Vendedor"],
  ["/cadastros/vendedores", "Vendedores"],
  ["/cadastros/categorias", "Categorias"],
  ["/cadastros/marcas", "Marcas"],
  ["/cadastros/frete", "Frete"],
  ["/cadastros/integracoes", "Integrações"],
  ["/produtos", "Produtos"],
  ["/catalogo", "Catálogo"],
  ["/promocoes", "Promoções"],
  ["/etiquetas", "Etiquetas"],
  ["/compras/pedidos/documento", "Documento de compra"],
  ["/compras/pedidos", "Compras"],
  ["/compras/relatorios", "Relatórios de compras"],
  ["/compras", "Compras"],
  ["/transportadora", "Logística"],
  ["/ecommerce", "Loja virtual"],
  ["/website", "Meu site"],
  ["/ads/whatsapp", "Anúncios no WhatsApp"],
  ["/ads", "Anúncios"],
  ["/whatsapp", "WhatsApp"],
  ["/xml", "XML"],
  ["/configuracoes", "Parâmetros do sistema"],
  ["/conta", "Minha conta"],
  ["/usuarios", "Usuários"],
  ["/sistema", "Sistema"]
];

const TELAS_DO_PORTAL = [
  ["/login-b2b", "Entrar"],
  ["/b2b-inicio", "Início"],
  ["/b2b-carrinho", "Carrinho"],
  ["/b2b-pedidos", "Pedidos"],
  ["/b2b-historico", "Histórico"],
  ["/b2b-financeiro", "Financeiro"],
  ["/b2b-xml", "Notas fiscais"],
  ["/b2b-perfil", "Meu perfil"]
];

const naTela = (caminho, rota) => caminho === rota || caminho.startsWith(`${rota}/`);

export function tituloDaAba(caminho) {
  const rota = (caminho || "/").replace(/\/+$/, "") || "/";
  const doPortal = TELAS_DO_PORTAL.find(([inicio]) => naTela(rota, inicio));
  if (doPortal) return `${doPortal[1]} · Portal B2B`;
  if (rota.startsWith("/b2b-")) return "Portal B2B";

  const doPainel = TELAS_DO_PAINEL.find(([inicio]) => naTela(rota, inicio));
  return doPainel ? `${doPainel[1]} · Raizan Core` : "Raizan Core";
}

// O Next só tem um título fixo para o site inteiro (exportação estática): a aba é trocada a cada tela
export default function TituloDaAba() {
  const caminho = usePathname();

  useEffect(() => {
    const titulo = tituloDaAba(caminho);
    const aplicar = () => { document.title = titulo; };
    aplicar();
    // O Next repõe o título fixo das pastas logo depois de abrir a tela: reaplica por alguns instantes.
    // Não fica vigiando para sempre, porque a impressão do mapa de separação troca o título de propósito.
    const tempos = [50, 300, 1000, 2500].map((ms) => setTimeout(aplicar, ms));
    return () => tempos.forEach(clearTimeout);
  }, [caminho]);

  return null;
}
