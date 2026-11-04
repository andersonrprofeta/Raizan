"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { getHubUrl, getHeaders } from '@/components/utils/api';

const MOTIVO_CORTE_PADRAO = 'Estoque insuficiente ou ajuste no ERP';
const TEMPO_MAXIMO_ATUALIZACAO_MS = 5000;

const moeda = (valor) => Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const nomeDoItem = (item) => String(item.name || item.nome || '');
const compararTexto = (a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base', numeric: true });

// Ordem da separação: marca e depois nome. Produto sem marca vai para o fim da lista.
function porMarcaENome(a, b) {
  const marcaA = String(a.marca || '').trim();
  const marcaB = String(b.marca || '').trim();
  if (!marcaA !== !marcaB) return marcaA ? -1 : 1;
  return compararTexto(marcaA, marcaB) || compararTexto(nomeDoItem(a), nomeDoItem(b));
}

// O separador só pega o que foi atendido: o que faltou sai da lista e vai para o quadro de cortes
export function montarSeparacao(pedido) {
  const itens = (pedido.line_items || []).map((item) => {
    const qtdPedida = Number(item.quantity || item.quantidade || item.qtd || 0);
    const qtdSeparar = item.qtd_faturada === null || item.qtd_faturada === undefined ? qtdPedida : Number(item.qtd_faturada);
    return { ...item, qtdPedida, qtdSeparar, qtdCortada: Math.max(0, qtdPedida - qtdSeparar) };
  }).sort(porMarcaENome);

  const itensCortados = itens.filter((item) => item.qtdCortada > 0);
  const totalOriginal = Number(pedido.valor_total ?? pedido.total ?? 0);
  const faturado = Number(pedido.valor_faturado);
  const usaFaturado = pedido.valor_faturado !== null && pedido.valor_faturado !== undefined && (faturado > 0 || itensCortados.length > 0);

  return {
    itensParaSeparar: itens.filter((item) => item.qtdSeparar > 0),
    itensCortados,
    totalOriginal,
    totalPedido: usaFaturado ? faturado : totalOriginal
  };
}

export default function ListaSeparacao({ pedido: pedidoRecebido, onFechar }) {
  const [pedido, setPedido] = useState(pedidoRecebido);
  const [empresa, setEmpresa] = useState({ nome: 'CARREGANDO...', cnpj: '...' });
  const [prontoParaImprimir, setProntoParaImprimir] = useState(false);

  useEffect(() => {
    const tempoLimite = new AbortController();
    const timer = setTimeout(() => tempoLimite.abort(), TEMPO_MAXIMO_ATUALIZACAO_MS);

    // O corte pode chegar pelo webhook depois da tela abrir: o papel sai com o pedido mais recente.
    // Se a busca falhar, imprime o que já estava carregado.
    const atualizarPedido = async () => {
      if (pedidoRecebido?.codigo_omie === undefined) return;
      try {
        const res = await fetch(`${getHubUrl()}/api/hub/pedidos/omie`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ page: 1, limit: 100 }),
          signal: tempoLimite.signal
        });
        const data = await res.json();
        const atualizado = data.pedidos?.find((p) => p.id === pedidoRecebido.id);
        if (atualizado) setPedido(atualizado);
      } catch (error) {
        console.error('Lista de separação: não foi possível atualizar o pedido.', error);
      }
    };

    const preparar = async () => {
      try {
        const nomeCache = localStorage.getItem("@raizan:nome");
        const tenantCache = localStorage.getItem("@raizan:tenant") || process.env.NEXT_PUBLIC_TENANT_ID;

        setEmpresa({
          nome: nomeCache || 'DISTRIBUIDORA AUTORIZADA',
          cnpj: tenantCache || 'CNPJ NÃO INFORMADO'
        });
      } catch (error) {
        setEmpresa({ nome: 'DISTRIBUIDORA AUTORIZADA', cnpj: 'CNPJ NÃO INFORMADO' });
      }

      await atualizarPedido();
      clearTimeout(timer);
      setProntoParaImprimir(true);
    };

    preparar();
    return () => { clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (prontoParaImprimir) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [prontoParaImprimir]);

  // Fechou a impressão, volta para a tela de onde saiu
  useEffect(() => {
    window.addEventListener('afterprint', onFechar);
    return () => window.removeEventListener('afterprint', onFechar);
  }, [onFechar]);

  if (!pedido) return null;

  const { itensParaSeparar, itensCortados, totalOriginal, totalPedido } = montarSeparacao(pedido);
  const totalItens = itensParaSeparar.length;
  const totalUnidades = itensParaSeparar.reduce((acc, item) => acc + item.qtdSeparar, 0);

  const dataAtual = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
  
  const calcularVencimento = (dias) => {
    if (!dias) return '___/___/___';
    const dataVenc = new Date(pedido.date_created || new Date());
    dataVenc.setDate(dataVenc.getDate() + Number(dias));
    return dataVenc.toLocaleDateString('pt-BR');
  };

  // 🟢 FUNÇÃO INTELIGENTE DE PAGAMENTO (BLINDADA CONTRA O OMIE)
  const traduzirPagamento = (codigoOriginal) => {
    const cod = String(codigoOriginal || '').toLowerCase().trim();
    
    if (!cod) return 'A COMBINAR';

    // 1. Dicionário de atalhos rápidos (Se quiser adicionar mais, é só pôr aqui)
    const dicionario = {
      '000': 'À VISTA / DINHEIRO / PIX',
      '999': 'A COMBINAR',
      '4dn': 'A PRAZO / BOLETO' // Pegando o código safado da sua imagem
    };

    if (dicionario[cod]) return dicionario[cod];

    // 2. Busca por palavras-chave dentro do texto
    if (cod.includes('vista') || cod.includes('pix') || cod.includes('dinheiro')) {
      return 'À VISTA / DINHEIRO / PIX';
    }
    
    if (cod.includes('combinar')) {
      return 'A COMBINAR';
    }

    // 3. Fallback: Se não é À Vista, nem A Combinar, assume que é Prazo.
    // Ocultamos o código alfanumérico feio (como 4DN, 001) para não confundir o separador.
    return 'A PRAZO / BOLETO';
  };
  
  // O Omie às vezes manda o código no campo de parcelas se o payment_method estiver vazio
  const formaPagamentoBase = pedido.payment_method_title || pedido.metodo_pagamento || pedido.codigo_parcela || '';
  const formaPagamento = traduzirPagamento(formaPagamentoBase);

  const endRua = pedido.billing?.address_1 || pedido.billing?.endereco || pedido.endereco || pedido.logradouro || 'ENDEREÇO NÃO INFORMADO';
  const endNumero = pedido.billing?.number || pedido.billing?.numero || pedido.numero ? `, ${pedido.billing?.number || pedido.billing?.numero || pedido.numero}` : '';
  const endBairro = pedido.billing?.neighborhood || pedido.billing?.bairro || pedido.bairro ? ` - Bairro: ${pedido.billing?.neighborhood || pedido.billing?.bairro || pedido.bairro}` : '';
  const endCidade = pedido.billing?.city || pedido.billing?.cidade || pedido.cidade || 'NÃO INFORMADA';
  const endUf = pedido.billing?.state || pedido.billing?.uf || pedido.uf ? ` / ${pedido.billing?.state || pedido.billing?.uf || pedido.uf}` : '';
  const endCep = pedido.billing?.postcode || pedido.billing?.cep || pedido.cep || 'NÃO INFORMADO';
  const endTelefone = pedido.billing?.phone || pedido.billing?.telefone || pedido.telefone || 'NÃO INFORMADO';

  if (!prontoParaImprimir) {
    return (
      <div className="fixed inset-0 z-[9999] bg-zinc-900/60 backdrop-blur-sm flex flex-col items-center justify-center">
        <Loader2 className="text-white animate-spin mb-4" size={48} />
        <p className="text-white font-bold tracking-widest uppercase">Gerando Documento...</p>
      </div>
    );
  }

  // Vai direto no body: dentro da tela, a impressão cortava a lista na primeira página
  return createPortal(
    <div className="lista-separacao fixed inset-0 z-[9999] bg-zinc-900/60 backdrop-blur-sm overflow-y-auto print:static print:inset-auto print:h-auto print:overflow-visible print:bg-white print:backdrop-blur-none font-sans">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { height: auto !important; overflow: visible !important; background: #fff !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body > *:not(.lista-separacao) { display: none !important; }
          .lista-separacao tr, .lista-separacao .page-break-inside-avoid { break-inside: avoid; }
        }
      `}} />

      <div className="print:hidden sticky top-0 left-0 right-0 bg-zinc-950 border-b border-zinc-800 text-white p-4 flex justify-between items-center shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <button onClick={onFechar} className="flex items-center gap-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-4 py-2 rounded-xl font-bold transition-all">
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95">
          <Printer size={18} /> Imprimir Separação
        </button>
      </div>

      <div className="w-full max-w-[210mm] mx-auto bg-white text-zinc-900 p-6 shadow-2xl print:shadow-none print:p-0 print:m-0 print:w-full print:h-auto">
        
        <div className="flex justify-between items-start border-b-2 border-purple-700 pb-3 mb-4">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-900 leading-none">{empresa.nome}</h1>
            <p className="text-[10px] text-zinc-500 mt-1">
              <strong className="text-zinc-700">CNPJ:</strong> {empresa.cnpj}
            </p>
            <p className="text-xs text-zinc-700 mt-1.5">
              <strong className="text-zinc-800">Vendedor:</strong> {pedido.vendedor_nome || 'Balcão'}
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-purple-700 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded mb-1.5">
              Lista de Separação
            </div>
            <Barcode value={String(pedido.pedido_id)} format="CODE128" width={1.4} height={34} displayValue={false} margin={0} background="#ffffff" />
            <p className="text-[10px] font-bold text-zinc-800 mt-1">Nº DO PEDIDO #{pedido.pedido_id}</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">Emitido: {dataAtual}</p>
          </div>
        </div>

        <div className="bg-[#f8f9fa] border border-zinc-200 p-3 rounded-lg mb-5 text-[10px] leading-tight">
          <div className="grid grid-cols-12 gap-y-2 gap-x-4">
            <div className="col-span-12 sm:col-span-8">
              <strong className="text-zinc-800 block mb-0.5">Cliente:</strong>
              <span className="text-zinc-700 uppercase">{pedido.billing?.first_name || 'NÃO INFORMADO'}</span>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <strong className="text-zinc-800 block mb-0.5">CNPJ/CPF:</strong>
              <span className="text-zinc-700 uppercase">{pedido.cnpj_cpf || 'Não Informado'}</span>
            </div>
            
            <div className="col-span-12 sm:col-span-8">
              <strong className="text-zinc-800 block mb-0.5">Endereço:</strong>
              <span className="text-zinc-700 uppercase">{endRua}{endNumero}{endBairro}</span>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <strong className="text-zinc-800 block mb-0.5">Cidade/UF:</strong>
              <span className="text-zinc-700 uppercase">{endCidade}{endUf}</span>
            </div>

            <div className="col-span-6 sm:col-span-4">
              <strong className="text-zinc-800 block mb-0.5">Telefone:</strong>
              <span className="text-zinc-700 uppercase">{endTelefone}</span>
            </div>
            <div className="col-span-6 sm:col-span-4">
              <strong className="text-zinc-800 block mb-0.5">CEP:</strong>
              <span className="text-zinc-700 font-bold">{endCep}</span>
            </div>
            <div className="col-span-12 sm:col-span-4">
              <strong className="text-zinc-800 block mb-0.5">Forma de Pagamento:</strong>
              <span className="text-purple-700 uppercase font-bold">{formaPagamento}</span>
            </div>
          </div>
        </div>

        <div>
          <table className="w-full text-left mb-4 border-collapse text-[9px]">
            <thead>
              <tr className="border-b-2 border-zinc-300">
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[8%]">Endereço</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[10%] text-center">Lote</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[10%] text-center">Vencimento</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[5%] text-center">Qtd</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[5%] text-center">Und</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[32%]">Descrição do Produto</th>
                <th className="py-1.5 px-1 font-black text-black uppercase w-[10%] text-center">Caract.</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[10%] text-center">Marca</th>
                <th className="py-1.5 px-1 font-bold text-zinc-700 uppercase w-[10%] text-right">Código SKU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {itensParaSeparar.map((item, index) => {
                return (
                  <tr key={index} className="page-break-inside-avoid hover:bg-zinc-50">
                    <td className="py-1.5 px-1 font-bold text-zinc-600 truncate max-w-[50px] uppercase" title={item.localizacao}>
                      {item.localizacao || '____'}
                    </td>
                    <td className="py-1.5 px-1 text-center text-zinc-900 font-bold uppercase">
                      {item.lote || '_______'}
                    </td>
                    <td className="py-1.5 px-1 text-center font-bold text-zinc-900 uppercase">
                      {item.vencimento || calcularVencimento(item.dias_validade)}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className="font-black text-[11px] text-zinc-900">{item.qtdSeparar}</span>
                    </td>
                    <td className="py-1.5 px-1 text-center font-bold text-zinc-500">UN</td>
                    <td className="py-1.5 px-1 uppercase pr-2">
                      <span className="text-[10px] font-medium text-zinc-800 leading-tight block">
                        {item.name}
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-center font-black text-black text-[10px] uppercase">
                      {item.caracteristica || '___'}
                    </td>
                    <td className="py-1.5 px-1 text-center font-bold text-zinc-600 truncate max-w-[50px] uppercase">
                      {item.marca || '_______'}
                    </td>
                    <td className="py-1.5 px-1 text-right font-mono text-zinc-900 font-black text-xs">
                      {item.sku || item.product_id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {itensCortados.length > 0 && (
            <div className="border border-red-300 rounded-lg p-2 mb-4" style={{ breakInside: 'avoid' }}>
              <strong className="text-red-700 text-[10px] uppercase tracking-widest block mb-1">
                Itens cortados: não separar as quantidades abaixo
              </strong>
              <table className="w-full text-left border-collapse text-[9px]">
                <thead>
                  <tr className="border-b border-red-200">
                    <th className="py-1 px-1 font-bold text-zinc-700 uppercase w-[39%]">Produto</th>
                    <th className="py-1 px-1 font-bold text-zinc-700 uppercase w-[8%] text-center">Pedido</th>
                    <th className="py-1 px-1 font-bold text-zinc-700 uppercase w-[8%] text-center">Atendido</th>
                    <th className="py-1 px-1 font-black text-red-700 uppercase w-[8%] text-center">Cortado</th>
                    <th className="py-1 px-1 font-bold text-zinc-700 uppercase w-[37%]">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {itensCortados.map((item, index) => (
                    <tr key={index}>
                      <td className="py-1 px-1 uppercase font-medium text-zinc-800">{nomeDoItem(item)}</td>
                      <td className="py-1 px-1 text-center text-zinc-700">{item.qtdPedida}</td>
                      <td className="py-1 px-1 text-center text-zinc-700">{item.qtdSeparar}</td>
                      <td className="py-1 px-1 text-center font-black text-[11px] text-red-700">{item.qtdCortada}</td>
                      <td className="py-1 px-1 text-zinc-700">{item.motivo_corte || MOTIVO_CORTE_PADRAO}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pedido.observacoes && (
            <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg mt-4 page-break-inside-avoid mb-4">
              <strong className="text-amber-900 text-[10px] uppercase tracking-widest block mb-0.5">Observações Adicionais:</strong>
              <p className="text-amber-800 text-[10px] font-medium leading-tight">{pedido.observacoes.toUpperCase()}</p>
            </div>
          )}
        </div>

        <div className="mt-6 page-break-inside-avoid border-t border-zinc-300 pt-6">
          <div className="flex justify-between items-start">
            
            <div className="flex gap-8 text-center text-[10px] text-zinc-600 font-medium w-2/3">
              <div className="flex-1 flex flex-col items-center">
                <div className="border-b border-zinc-400 w-full mb-1 h-6"></div>
                <p>Separado por</p>
                <p className="mt-3 text-[10px] text-zinc-800 font-bold tracking-widest font-mono whitespace-nowrap">___/___/___ &nbsp;&nbsp; ___:___</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="border-b border-zinc-400 w-full mb-1 h-6"></div>
                <p>Conferido por</p>
                <p className="mt-3 text-[10px] text-zinc-800 font-bold tracking-widest font-mono whitespace-nowrap">___/___/___ &nbsp;&nbsp; ___:___</p>
              </div>
              <div className="flex-1 flex flex-col items-center">
                <div className="border-b border-zinc-400 w-full mb-1 h-6"></div>
                <p>Embalado por</p>
                <p className="mt-3 text-[10px] text-zinc-800 font-bold tracking-widest font-mono whitespace-nowrap">___/___/___ &nbsp;&nbsp; ___:___</p>
              </div>
            </div>

            <div className="w-1/3 pl-8">
              <div className="flex justify-between items-end gap-2 text-[10px] text-zinc-600 mb-2">
                <span className="whitespace-nowrap">Volumes (Caixas):</span>
                <span className="flex-1 h-7 border-b border-zinc-800" />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
                <span>Unidades Totais:</span>
                <span className="font-bold text-zinc-800">{totalUnidades} UN</span>
              </div>
              <div className="flex justify-between text-[11px] font-black text-zinc-900 mt-1 pt-1 border-t border-zinc-200">
                <span>Total de Itens:</span>
                <span className="text-purple-700">{totalItens}</span>
              </div>
              {itensCortados.length > 0 && (
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>Valor original:</span>
                  <span className="line-through">{moeda(totalOriginal)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] font-black text-zinc-900 mt-1 pt-1 border-t border-zinc-200">
                <span>Total do Pedido:</span>
                <span className="text-purple-700">{moeda(totalPedido)}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}