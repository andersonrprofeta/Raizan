"use client";

import React, { useEffect } from "react";
import Barcode from "react-barcode";
import toast from "react-hot-toast";

export default function EtiquetaVolume({
  config = { largura: 100, altura: 150 }, 
  logoUrl = "", 
  empresa = { nome: "EMPRESA NAO INFORMADA", cnpj: "00.000.000/0001-00" },
  cliente = { nome: "DESTINATARIO", documento: "000.000.000-00", endereco: {} },
  pedido = { numero: "000000", data: "00/00/0000" },
  transporte = { nome: "TRANSPORTADORA", peso: "1.0 kg" },
  nfe = { numero: "000.000", serie: "1", chave: "00000000000000000000000000000000000000000000" },
  volume = { atual: 1, total: 1 },
  autoPrint = false
}) {

  useEffect(() => {
    if (autoPrint) {
      // 🟢 Como não tem mais mensagem para esperar sumir, abaixamos o tempo pra ficar rápido!
      const timer = setTimeout(() => {
        toast.dismiss(); // Garante limpeza
        window.print();
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const logradouro = cliente.endereco?.logradouro || "Endereço não informado";
  const numero = cliente.endereco?.numero || "S/N";
  const complemento = cliente.endereco?.complemento ? ` - ${cliente.endereco.complemento}` : "";
  const bairro = cliente.endereco?.bairro || "Bairro";
  const cidade = cliente.endereco?.cidade || "Cidade";
  const uf = cliente.endereco?.uf || "UF";
  const cep = cliente.endereco?.cep || "00000-000";

  const chaveValida = nfe.chave && nfe.chave.replace(/\D/g, '').length === 44;

  const totalVolumes = parseInt(volume.total) || 1;
  const paginas = Array.from({ length: totalVolumes }, (_, i) => i + 1);

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: ${config.largura}mm ${config.altura}mm; margin: 0; padding: 0; }
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            height: auto !important; 
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            color-adjust: exact !important; 
          }
          
          /* 🟢 ASSASSINO DE TOAST E FANTASMAS NA IMPRESSORA: Esconde overlays flutuantes */
          div[style*="z-index: 9999"], [role="status"], .Toaster, #hot-toast-container { display: none !important; visibility: hidden !important; opacity: 0 !important; }

          #print-wrapper {
            width: 100% !important;
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .etiqueta-page {
            width: ${config.largura}mm !important;
            height: ${config.altura}mm !important;
            display: block !important;
            page-break-after: always !important; 
            break-after: page !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          .etiqueta-page:last-child {
            page-break-after: auto !important; 
            break-after: auto !important;
          }
        }
      `}} />

      <div id="print-wrapper" className="flex flex-col gap-6 items-center">
        {paginas.map((numVolume) => (
          <div
            key={numVolume}
            className="etiqueta-page bg-white text-black font-sans flex flex-col relative border-4 border-black p-[4mm] box-border shadow-2xl"
            style={{ width: `${config.largura}mm`, height: `${config.altura}mm` }}
          >
            {/* CABEÇALHO */}
            <div className="flex justify-between items-start border-b-[3px] border-black pb-2 mb-2 shrink-0">
              <div className="w-2/3 pr-2 flex items-center h-16">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain grayscale contrast-[200%] brightness-[90%]" />
                ) : (
                  <h1 className="font-black text-3xl tracking-tighter uppercase leading-none truncate">{empresa.nome.split(' ')[0]}</h1>
                )}
              </div>
              <div className="w-1/3 text-right border-l-[3px] border-black pl-2 flex flex-col justify-center h-16">
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Volume</p>
                <p className="text-4xl font-black leading-none tracking-tighter">{numVolume}/{totalVolumes}</p>
              </div>
            </div>

            {/* TRANSPORTADORA / PEDIDO COM CÓDIGO DE BARRAS */}
            <div className="flex border-b-[3px] border-black pb-2 mb-2 shrink-0">
              <div className="w-[55%] border-r-[3px] border-black pr-2">
                <p className="text-[9px] font-bold uppercase mb-0.5">Transportadora</p>
                <p className="font-black text-sm uppercase leading-tight line-clamp-2">{transporte.nome}</p>
                <p className="text-[10px] font-bold mt-1">Peso: {transporte.peso}</p>
              </div>
              <div className="w-[45%] pl-2 flex flex-col items-end justify-center text-right overflow-hidden">
                <div className="flex w-full justify-between items-end mb-1">
                  <p className="text-[9px] font-bold uppercase">Pedido</p>
                  <p className="text-[8px] font-bold">{pedido.data}</p>
                </div>
                <div className="bg-white">
                  <Barcode value={String(pedido.numero)} format="CODE128" width={1.2} height={20} displayValue={false} margin={0} background="#ffffff" lineColor="#000000" />
                </div>
                <p className="font-black text-xl leading-none mt-1">#{pedido.numero}</p>
              </div>
            </div>

            {/* DESTINATÁRIO */}
            <div className="flex-1 flex flex-col justify-center border-b-[3px] border-black pb-2 mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-white bg-black inline-block px-2 py-0.5 w-max" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}>Destinatário</p>
              <h2 className="font-black text-lg uppercase leading-none mb-1.5 truncate">{cliente.nome}</h2>
              <p className="text-xs font-bold leading-tight mb-1 uppercase truncate">{`${logradouro}, ${numero}${complemento}`}</p>
              <p className="text-xs font-bold leading-tight mb-1 uppercase truncate">{`${bairro} - ${cidade} / ${uf}`}</p>
              <div className="flex justify-between items-end mt-2">
                <p className="font-black text-xl tracking-widest">{cep}</p>
                <p className="text-[10px] font-bold uppercase">DOC: {cliente.documento}</p>
              </div>
            </div>

            {/* REMETENTE */}
            <div className="border-b-[3px] border-black pb-1 mb-1 shrink-0">
              <p className="text-[8px] font-bold uppercase leading-tight truncate">Remetente: {empresa.nome}</p>
              <p className="text-[8px] font-bold uppercase leading-tight">CNPJ: {empresa.cnpj}</p>
            </div>

            {/* NFE E CÓDIGO DE BARRAS */}
            <div className="shrink-0 flex flex-col items-center text-center mt-auto">
              <div className="w-full flex justify-between px-1 mb-1">
                <p className="text-[8px] font-bold uppercase">DANFE Simplificado</p>
                <p className="text-[8px] font-bold uppercase">NFe: {nfe.numero} - Série: {nfe.serie}</p>
              </div>
              
              <div className="w-full bg-white flex justify-center py-1">
                {chaveValida ? (
                  <Barcode value={nfe.chave} format="CODE128" width={1.2} height={40} displayValue={false} margin={0} background="#ffffff" lineColor="#000000" />
                ) : (
                  <div className="h-10 bg-zinc-200 w-full flex items-center justify-center text-xs font-bold text-zinc-400">CHAVE NÃO ENCONTRADA</div>
                )}
              </div>
              
              <p className="text-[8px] font-black tracking-widest mt-1 w-full text-center break-all">{nfe.chave}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}