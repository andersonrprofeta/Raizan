"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { chamarApi } from "./sessao";
import { Botao, moeda } from "./ui";

const VALIDADE_DO_PIX_S = 1800;
const INTERVALO_DA_CONSULTA_MS = 5000;
const QR_CODE_VALIDO = 50;

const relogio = (segundos) => `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

async function pedidoFoiPago(pedidoId) {
  const dados = await chamarApi(`/api/hub/pedidos/status/${pedidoId}`);
  return dados.status === "pago";
}

export function PixAguardando({ pix, pedidoId, valor, onPago }) {
  const [segundos, setSegundos] = useState(VALIDADE_DO_PIX_S);
  const [copiado, setCopiado] = useState(false);
  const [conferindo, setConferindo] = useState(false);
  const aoPagar = useRef(onPago);
  aoPagar.current = onPago;

  useEffect(() => {
    const contador = setInterval(() => setSegundos((atual) => Math.max(0, atual - 1)), 1000);
    const consulta = setInterval(async () => {
      if (await pedidoFoiPago(pedidoId).catch(() => false)) aoPagar.current();
    }, INTERVALO_DA_CONSULTA_MS);
    return () => { clearInterval(contador); clearInterval(consulta); };
  }, [pedidoId]);

  const copiar = async () => {
    await navigator.clipboard.writeText(pix.qr_code);
    setCopiado(true);
    toast.success("Código Pix copiado");
    setTimeout(() => setCopiado(false), 3000);
  };

  const conferir = async () => {
    setConferindo(true);
    const pago = await pedidoFoiPago(pedidoId).catch(() => false);
    setConferindo(false);
    if (pago) aoPagar.current();
    else toast.error("Ainda não identificamos o pagamento. Aguarde alguns segundos e tente de novo.");
  };

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
      <p className="text-sm text-zinc-500">Valor do Pix</p>
      <p className="text-3xl font-bold tabular-nums text-zinc-900">{moeda(valor)}</p>
      <p className="mt-1 text-sm text-zinc-500">Expira em <strong className={`tabular-nums ${segundos < 300 ? "text-rose-600" : "text-zinc-800"}`}>{relogio(segundos)}</strong></p>

      {pix.qr_code_base64?.length > QR_CODE_VALIDO && (
        <img src={`data:image/png;base64,${pix.qr_code_base64}`} alt="QR Code do Pix" className="mt-5 h-52 w-52 rounded-2xl border border-zinc-200 p-2" />
      )}

      <Botao className="mt-5 w-full" onClick={copiar}>
        {copiado ? <Check size={18} /> : <Copy size={18} />} {copiado ? "Copiado" : "Copiar código Pix"}
      </Botao>
      <p className="mt-3 text-sm text-zinc-500">Abra o app do seu banco, escolha Pix copia e cola e cole o código.</p>

      <button type="button" onClick={conferir} disabled={conferindo} className="mt-4 inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-violet-700">
        <RefreshCw size={15} className={conferindo ? "animate-spin" : ""} /> Já paguei
      </button>
    </div>
  );
}

// O formulário do cartão é do próprio Mercado Pago: os dados do cartão não passam pelo portal
export function FormularioCartao({ chavePublica, valor, onEnviar }) {
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    initMercadoPago(chavePublica, { locale: "pt-BR" });
    setPronto(true);
  }, [chavePublica]);

  if (!pronto) return <div className="flex justify-center py-8 text-zinc-400"><Loader2 size={24} className="animate-spin" /></div>;
  return (
    <Payment
      initialization={{ amount: valor }}
      customization={{ visual: { style: { theme: "default", customVariables: { baseColor: "#9333ea", borderRadiusMedium: "12px" } } }, paymentMethods: { creditCard: "all", debitCard: "all" } }}
      onSubmit={async ({ formData }) => onEnviar(formData)}
    />
  );
}
