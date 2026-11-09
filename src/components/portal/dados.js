"use client";

// Dados do portal guardados por um minuto: trocar de tela não faz o lojista esperar de novo.

import { useCallback, useEffect, useState } from "react";
import { fatorDoLojista, guardarAcrescimo } from "@/components/utils/acrescimoPortal";
import { atualizarPrecos } from "./carrinho";
import { chamarApi, lerUsuario } from "./sessao";
import { valeHoje } from "@/components/utils/horaBrasilia";

const VALIDADE_MS = 60_000;
const LIMITE_DE_PEDIDOS = 200;
const guardados = new Map();

export function esquecerDados(chave) {
  guardados.delete(chave);
}

// O catálogo muda pouco e é a maior resposta da API: fica guardado por mais tempo
const VALIDADE_POR_CHAVE = { catalogo: 10 * 60_000 };

function buscarGuardado(chave, buscar) {
  const guardado = guardados.get(chave);
  if (guardado && Date.now() - guardado.quando < (VALIDADE_POR_CHAVE[chave] || VALIDADE_MS)) return guardado.promessa;

  const promessa = buscar().catch((erro) => {
    guardados.delete(chave);
    throw erro;
  });
  guardados.set(chave, { promessa, quando: Date.now() });
  return promessa;
}

function useRecurso(chave, buscar) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: false });

  const carregar = useCallback(async () => {
    try {
      const dados = await buscarGuardado(chave, buscar);
      setEstado({ dados, carregando: false, erro: false });
    } catch (erro) {
      setEstado((anterior) => ({ ...anterior, carregando: false, erro: true }));
    }
  }, [chave, buscar]);

  useEffect(() => { carregar(); }, [carregar]);

  const recarregar = useCallback(() => {
    esquecerDados(chave);
    return carregar();
  }, [chave, carregar]);

  return { ...estado, recarregar };
}

const semFalhar = (promessa) => promessa.catch(() => null);

const CODIGOS_DE_TEXTO = { amp: "&", apos: "'", quot: '"', lt: "<", gt: ">", nbsp: " " };

// O ERP manda alguns nomes com códigos de página ("L&apos;man"): aqui viram o caractere de verdade
export function textoLimpo(texto) {
  return String(texto ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (original, codigo) => {
    if (codigo[0] === "#") {
      const numero = codigo[1].toLowerCase() === "x" ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(numero) ? String.fromCodePoint(numero) : original;
    }
    return CODIGOS_DE_TEXTO[codigo.toLowerCase()] ?? original;
  });
}

const comparavel = (texto) => String(texto ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

// O ERP costuma mandar a cidade como "Goiânia (GO)" ou "Goiânia - GO"
const UF_NO_FIM_DA_CIDADE = /\s*[-(/]\s*([A-Z]{2})\s*\)?$/;
const semUf = (cidade) => comparavel(cidade).replace(UF_NO_FIM_DA_CIDADE, "");

function lugaresDaRota(rota) {
  try {
    const lista = typeof rota.parametros === "string" ? JSON.parse(rota.parametros) : rota.parametros;
    return Array.isArray(lista) ? lista : [];
  } catch (erro) {
    return [];
  }
}

// A regra ligada ao cliente vale primeiro. Sem ela, vale a regra da cidade e depois a do estado:
// assim o cliente cadastrado depois da última sincronização da regra também vê o frete grátis.
export function acharRota(rotas, cliente, endereco) {
  const lista = rotas || [];
  const ligada = lista.find((rota) => cliente?.id_rota_frete && String(rota.id) === String(cliente.id_rota_frete));
  if (ligada) return ligada;

  const cidadeCompleta = comparavel(endereco?.cidade || endereco?.city);
  const cidade = semUf(cidadeCompleta);
  const uf = comparavel(endereco?.uf || endereco?.estado || endereco?.state) || cidadeCompleta.match(UF_NO_FIM_DA_CIDADE)?.[1] || "";
  return lista.find((rota) => rota.tipo_vinculo === "cidade" && cidade && lugaresDaRota(rota).some((lugar) => semUf(lugar) === cidade))
    || lista.find((rota) => rota.tipo_vinculo === "uf" && uf && lugaresDaRota(rota).some((lugar) => comparavel(lugar) === uf))
    || null;
}

// Vale do primeiro ao último dia inteiros, no dia de Brasília (antes sumia no último dia)
function ofertaDeHoje(oferta) {
  return Boolean(oferta.ativo) && valeHoje(oferta.data_inicio, oferta.data_fim);
}

// A oferta do dia vira a promoção do produto, para valer igual em qualquer tela
async function buscarCatalogo() {
  const [resposta, respostaOfertas] = await Promise.all([
    chamarApi("/api/hub/produtos?limit=5000&para_venda=1"),
    semFalhar(chamarApi("/api/admin/promocoes")),
  ]);
  if (!resposta?.success) throw new Error("Catálogo indisponível");

  if (resposta.acrescimo_cpf !== undefined) guardarAcrescimo(resposta.acrescimo_cpf);
  const fator = fatorDoLojista(lerUsuario());

  const ofertas = new Map((respostaOfertas?.promocoes || []).filter((oferta) => ofertaDeHoje(oferta)).map((oferta) => [String(oferta.sku).trim(), oferta]));

  const produtos = resposta.produtos.filter((produto) => produto.status !== "inativo").map((produto) => {
    const sku = String(produto.sku || produto.id).trim();
    const oferta = ofertas.get(sku);
    const promocional = Number(oferta?.preco_promocional ?? produto.preco_promocional) || 0;

    return {
      id: produto.id,
      sku,
      nome: textoLimpo(produto.nome),
      gtin: produto.gtin,
      marca: textoLimpo(produto.marca).trim(),
      estoque_inicial: Number(produto.estoque_inicial) || 0,
      imagens_anexos: produto.imagens_anexos,
      preco_venda: (Number(produto.preco_venda) || 0) * fator,
      preco_promocional: promocional > 0 ? promocional * fator : null,
      qtd_minima_promocao: oferta ? oferta.qtd_minima || 1 : produto.qtd_minima_promocao,
      em_oferta: Boolean(oferta),
    };
  });

  atualizarPrecos(produtos);
  return { produtos };
}

const lerJson = (valor) => {
  if (!valor) return {};
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor) || {};
  } catch (erro) {
    return {};
  }
};

async function buscarCadastro() {
  const [clientes, rotas, condicoes, regras] = await Promise.all([
    semFalhar(chamarApi("/api/hub/clientes")),
    semFalhar(chamarApi("/api/hub/rotas-frete")),
    semFalhar(chamarApi("/api/hub/integracoes/omie/condicoes-pagamento")),
    semFalhar(chamarApi("/api/hub/parametros/app")),
  ]);

  // Para o lojista, a API devolve só o cadastro dele
  const cliente = clientes?.clientes?.[0] || null;
  const extras = lerJson(cliente?.metadata_json);
  const endereco = lerJson(cliente?.endereco_json);
  const telefone = cliente?.telefone || endereco.telefone || endereco.phone || "";

  return {
    cliente,
    endereco,
    telefone,
    cadastroCompleto: !cliente || Boolean(telefone && (endereco.cep || endereco.postcode)),
    rota: acharRota(rotas?.rotas, cliente, endereco),
    limite: Number(extras.limite_credito) || 0,
    emAberto: Number(extras.valor_em_aberto || extras.total_a_vencer) || 0,
    prazosDoCliente: extras.condicoes_permitidas || [],
    condicoes: condicoes?.condicoes || [],
    prazosGerais: regras?.regras?.prazos_gerais || [],
    prefixoBonificados: regras?.regras?.provadores?.prefixo || "",
  };
}

async function buscarPedidos() {
  const resposta = await chamarApi("/api/hub/pedidos/b2b", {
    metodo: "POST",
    corpo: { page: 1, limit: LIMITE_DE_PEDIDOS, clienteEmail: lerUsuario()?.email },
  });
  if (!resposta?.success) throw new Error("Pedidos indisponíveis");
  return resposta.pedidos;
}

async function buscarMetodos() {
  const resposta = await chamarApi("/api/hub/pagamentos/metodos-ativos");
  return {
    boleto: resposta?.faturado !== false,
    online: Boolean(resposta?.mercadopago && resposta?.mpPublicKey),
    chavePublica: resposta?.mpPublicKey || "",
  };
}

export const useCatalogo = () => useRecurso("catalogo", buscarCatalogo);
export const useCadastro = () => useRecurso("cadastro", buscarCadastro);
export const usePedidos = () => useRecurso("pedidos", buscarPedidos);
export const useMetodos = () => useRecurso("metodos", buscarMetodos);

// Prazo geral vale para todos, e o do cadastro é um extra só deste cliente
export function prazosLiberados({ prazosGerais = [], prazosDoCliente = [], condicoes = [] }) {
  const codigos = [...new Set([...prazosGerais, ...prazosDoCliente].map((codigo) => String(codigo).trim()))];
  if (codigos.length === 0) return condicoes;

  const encontrados = condicoes.filter((opcao) => codigos.includes(String(opcao.codigo).trim()));
  return encontrados.length > 0 ? encontrados : codigos.map((codigo) => ({ codigo, descricao: `Prazo ${codigo}` }));
}
