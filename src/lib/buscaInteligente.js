// Busca inteligente de produtos: a mesma regra em todos os canais do Raizan.
// O ORIGINAL fica na API (api-raizan/src/services/buscaInteligente.js). O Core e o app do vendedor
// têm uma CÓPIA IGUAL deste arquivo: ao mudar aqui, copie para lá também (o teste da API confere).
//
// Como funciona, em português simples:
// - maiúscula/minúscula e acento não importam ("pessego" acha "PÊSSEGO");
// - cada palavra digitada precisa aparecer em algum campo (nome, código, EAN, marca, categoria, descrição);
// - plural simples vira singular ("batons" acha "batom", "cores" acha "cor");
// - número com ou sem zero na frente é o mesmo ("cor 3" acha "03");
// - palavras como "de", "com", "cor", "tom" são ignoradas quando há outras palavras;
// - o que bate no nome vem antes do que só bate na descrição; código exato vem primeiro de tudo.

const IGNORADAS = new Set(['a', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'com', 'para', 'pra', 'p', 'cor', 'tom', 'n', 'num', 'nr', 'numero']);

// Peso de cada campo: nome vale mais que descrição
const PESOS = { nome: 10, codigo: 9, marca: 8, categoria: 6, extra: 2 };

// Nomes que cada canal usa para o mesmo dado
const CAMPOS = {
  nome: ['nome', 'PDNOME'],
  codigo: ['sku', 'codigo', 'gtin', 'ean', 'PDCODPRO', 'PDCODBARRA'],
  marca: ['marca'],
  categoria: ['categoria'],
  extra: ['descricao', 'breve_descricao', 'atributos', 'variacoes', 'tags', 'keywords'],
};

function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Só letras e números colados: serve para comparar códigos ("ABC-123" = "abc123")
const compactar = (texto) => String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const ehNumero = (palavra) => /^\d+$/.test(palavra);
const semZeroNaFrente = (numero) => numero.replace(/^0+(?=\d)/, '');

// Singular aproximado do português, igual para o que é digitado e para o cadastro
function raiz(palavra) {
  let p = palavra;
  if (p.length > 3) {
    if (p.endsWith('ns')) p = `${p.slice(0, -2)}m`;
    else if (/(oes|aes|aos)$/.test(p)) p = `${p.slice(0, -3)}ao`;
    else if (p.endsWith('eis')) p = `${p.slice(0, -3)}el`;
    else if (/[aou]is$/.test(p)) p = `${p.slice(0, -2)}l`;
    else if (/(r|z|ss)es$/.test(p)) p = p.slice(0, -2);
    else if (p.endsWith('s') && !p.endsWith('ss')) p = p.slice(0, -1);
  }
  // "batom" e "baton" são escritos dos dois jeitos
  return p.replace(/m$/, 'n');
}

function textoDoCampo(valor) {
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object') {
    try { return JSON.stringify(valor); } catch { return ''; }
  }
  return String(valor);
}

function prepararBusca(texto) {
  const todas = normalizar(texto).split(' ').filter(Boolean).slice(0, 8);
  const uteis = todas.filter((palavra) => !IGNORADAS.has(palavra));
  const palavras = (uteis.length ? uteis : todas).map((palavra) => ({
    texto: palavra,
    numero: ehNumero(palavra) ? semZeroNaFrente(palavra) : null,
    raiz: ehNumero(palavra) ? null : raiz(palavra),
  }));
  return { palavras, compacto: compactar(texto), vazia: palavras.length === 0 };
}

// Prepara o produto uma vez só: a lista do Core tem milhares de itens e a busca roda a cada tecla
const CACHE = typeof WeakMap === 'function' ? new WeakMap() : null;

function indiceDoProduto(produto) {
  const guardado = CACHE && CACHE.get(produto);
  if (guardado) return guardado;
  const indice = {};
  for (const [grupo, chaves] of Object.entries(CAMPOS)) {
    const brutos = chaves.map((chave) => textoDoCampo(produto[chave])).filter(Boolean);
    const texto = normalizar(brutos.join(' '));
    const tokens = texto ? texto.split(' ') : [];
    const codigos = grupo === 'codigo' ? brutos.map(compactar).filter(Boolean) : [];
    indice[grupo] = {
      texto: ` ${texto} `,
      raizes: tokens.map((token) => (ehNumero(token) ? null : raiz(token))),
      // No código, número só vale inteiro: "cor 3" não pode achar o produto de código "BT-003"
      numeros: new Set(grupo === 'codigo' ? codigos.filter(ehNumero).map(semZeroNaFrente) : tokens.filter(ehNumero).map(semZeroNaFrente)),
      codigos,
    };
  }
  if (CACHE) CACHE.set(produto, indice);
  return indice;
}

// Quanto uma palavra combina com um campo: 1 = palavra inteira, 0.8 = começo da palavra, 0.4 = no meio
function forcaNoCampo(palavra, campo) {
  if (palavra.numero !== null) {
    if (campo.numeros.has(palavra.numero)) return 1;
    // Código digitado pela metade (4+ dígitos), ex.: parte do EAN
    if (palavra.texto.length >= 4 && campo.codigos.some((codigo) => codigo.includes(palavra.texto))) return 0.6;
    return 0;
  }
  let melhor = 0;
  for (const raizDoCampo of campo.raizes) {
    if (!raizDoCampo) continue;
    if (raizDoCampo === palavra.raiz) return 1;
    if (raizDoCampo.startsWith(palavra.raiz) || raizDoCampo.startsWith(palavra.texto)) melhor = 0.8;
  }
  if (!melhor && palavra.texto.length >= 3 && campo.texto.includes(palavra.texto)) melhor = 0.4;
  if (!melhor && palavra.texto.length >= 3 && campo.codigos.some((codigo) => codigo.includes(palavra.texto))) melhor = 0.6;
  return melhor;
}

// Nota do produto para a busca. Zero = não aparece.
let ultimaBusca = { texto: null, preparada: null };

function pontuarProduto(produto, busca) {
  // Quem chama produto a produto com o mesmo texto não prepara a busca milhares de vezes
  if (typeof busca === 'string' && ultimaBusca.texto !== busca) ultimaBusca = { texto: busca, preparada: prepararBusca(busca) };
  const preparada = typeof busca === 'string' ? ultimaBusca.preparada : busca;
  if (!preparada || preparada.vazia) return 1;
  const indice = indiceDoProduto(produto);

  // Código ou EAN exato, do jeito que veio do leitor de código de barras
  if (preparada.compacto.length >= 3 && indice.codigo.codigos.includes(preparada.compacto)) return 1000;

  let nota = 0;
  let todasNoNome = true;
  for (const palavra of preparada.palavras) {
    let melhor = 0;
    for (const grupo of Object.keys(PESOS)) {
      const forca = forcaNoCampo(palavra, indice[grupo]);
      if (forca) melhor = Math.max(melhor, PESOS[grupo] * forca);
    }
    if (!melhor) return 0;
    if (!forcaNoCampo(palavra, indice.nome)) todasNoNome = false;
    nota += melhor;
  }
  if (todasNoNome) nota += 5;
  const primeira = preparada.palavras[0];
  if (primeira && primeira.raiz && indice.nome.raizes[0] && indice.nome.raizes[0].startsWith(primeira.raiz)) nota += 3;
  return nota;
}

const combinaComBusca = (produto, busca) => pontuarProduto(produto, busca) > 0;

// Filtra e ordena pela nota. "desempate" decide entre notas iguais (ex.: quem tem estoque primeiro).
function buscarProdutos(produtos, texto, desempate) {
  const preparada = prepararBusca(texto);
  if (preparada.vazia) return [...produtos];
  return produtos
    .map((produto, posicao) => ({ produto, posicao, nota: pontuarProduto(produto, preparada) }))
    .filter((item) => item.nota > 0)
    .sort((a, b) => (b.nota - a.nota) || (desempate ? desempate(a.produto, b.produto) : 0) || (a.posicao - b.posicao))
    .map((item) => item.produto);
}

export { normalizar, raiz, prepararBusca, pontuarProduto, combinaComBusca, buscarProdutos };
