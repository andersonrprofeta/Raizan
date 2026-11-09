import { agoraEmBrasilia } from "@/components/utils/horaBrasilia";

// Todos os motivos de ocorrência da bipagem no checkout, num lugar só.
// A tela de bipagem grava o motivo; o histórico e o PDF mostram o título, o que aconteceu e o que fazer.

export const MOTIVOS = {
  fora_do_pedido: {
    titulo: "Produto não pertence ao pedido",
    explicacao: "Foi bipado um produto do cadastro que não faz parte deste pedido.",
    oQueFazer: "Tirar o produto da caixa e devolver ao estoque.",
  },
  codigo_desconhecido: {
    titulo: "Código não cadastrado",
    explicacao: "O código lido não pertence a nenhum produto ativo do cadastro. Pode ser etiqueta errada, leitura falha, produto bloqueado ou sem cadastro.",
    oQueFazer: "Conferir a etiqueta do produto e, se preciso, cadastrar o código no produto certo.",
  },
  passou_do_pedido: {
    titulo: "Bipou além do pedido",
    explicacao: "O produto já estava com todas as unidades do pedido bipadas e foi bipada mais uma.",
    oQueFazer: "Tirar a unidade a mais da caixa.",
  },
  quantidade_acima: {
    titulo: "Tentou bipar a mais",
    explicacao: "A quantidade digitada era maior do que faltava para completar o produto.",
    oQueFazer: "Contar as unidades na caixa e bipar só o que falta.",
  },
  depois_de_concluir: {
    titulo: "Bipou depois de contar tudo",
    explicacao: "Todos os produtos já estavam conferidos e ainda assim algo foi bipado.",
    oQueFazer: "Finalizar a embalagem sem colocar mais nada na caixa.",
  },
  pedido_alterado: {
    titulo: "Pedido mudou durante a conferência",
    explicacao: "As quantidades do pedido mudaram no ERP (corte ou edição) enquanto a caixa era conferida.",
    oQueFazer: "Conferir a caixa de novo antes de finalizar.",
  },
  separador_trocado: {
    titulo: "Separador trocado no meio",
    explicacao: "A pessoa que separou o pedido foi trocada depois que a bipagem já tinha começado.",
    oQueFazer: "Confirmar com a equipe quem realmente separou o pedido.",
  },
  saiu_sem_terminar: {
    titulo: "Saiu no meio da conferência",
    explicacao: "A tela de bipagem foi fechada com produtos ainda faltando e a conferência foi retomada depois.",
    oQueFazer: "Conferir se a caixa não foi mexida enquanto a tela estava fechada.",
  },
};

// Registros antigos só têm o título: assim eles também ganham explicação
const PELO_TITULO_ANTIGO = {
  "Produto não consta no pedido": "fora_do_pedido",
  "Produto já concluído": "passou_do_pedido",
  "Quantidade acima do pedido": "quantidade_acima",
  "Contagem concluída": "depois_de_concluir",
  "Pedido alterado no ERP": "pedido_alterado",
};

export const chaveDoMotivo = (ocorrencia) => (MOTIVOS[ocorrencia?.motivo] ? ocorrencia.motivo : PELO_TITULO_ANTIGO[ocorrencia?.tipo] || null);

export const motivoDa = (ocorrencia) => MOTIVOS[chaveDoMotivo(ocorrencia)] || { titulo: ocorrencia?.tipo || "Ocorrência", explicacao: "", oQueFazer: "" };

// "responsavel" é quem estava bipando: com o horário, acha o momento certo nas câmeras
export const novaOcorrencia = (motivo, { produto = null, codigo = null, detalhe = null, responsavel = null } = {}) => ({
  id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
  motivo,
  tipo: MOTIVOS[motivo]?.titulo || motivo,
  produto,
  codigo,
  detalhe,
  responsavel,
  hora: agoraEmBrasilia(),
});

// Quantas vezes cada motivo aconteceu, do mais frequente ao menos
export function resumoPorMotivo(ocorrencias = []) {
  const contagem = new Map();
  for (const ocorrencia of ocorrencias) {
    const chave = chaveDoMotivo(ocorrencia) || `outro:${ocorrencia?.tipo}`;
    const atual = contagem.get(chave) || { chave, titulo: motivoDa(ocorrencia).titulo, total: 0 };
    atual.total += 1;
    contagem.set(chave, atual);
  }
  return [...contagem.values()].sort((a, b) => b.total - a.total);
}

// O que mudou no pedido entre duas montagens da conferência (para a ocorrência "pedido mudou")
export function mudancasDoPedido(antes, depois) {
  const chaves = new Set([...Object.keys(antes || {}), ...Object.keys(depois || {})]);
  const linhas = [];
  for (const chave of chaves) {
    const a = antes?.[chave];
    const d = depois?.[chave];
    if (a && !d) linhas.push(`${a.nome}: saiu do pedido`);
    else if (!a && d) linhas.push(`${d.nome}: entrou no pedido (${d.qtdPedida})`);
    else if (a.qtdPedida !== d.qtdPedida) linhas.push(`${d.nome}: ${a.qtdPedida} → ${d.qtdPedida}`);
  }
  return linhas.join("; ");
}
