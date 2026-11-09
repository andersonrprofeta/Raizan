// Mesmo vidro e mesmos botões da tela de Pedidos, compartilhados pelo checkout e pela bipagem.
export const VIDRO =
  "relative rounded-[28px] border border-black/[0.06] dark:border-white/[0.07] " +
  "bg-white/80 dark:bg-[#121214]/80 backdrop-blur-xl " +
  "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_14px_34px_-18px_rgba(0,0,0,0.14)] " +
  "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_24px_50px_-26px_rgba(0,0,0,0.9)]";

export const BOTAO_ROXO =
  "flex items-center justify-center gap-2 rounded-full font-semibold text-white transition-all duration-300 active:scale-95 " +
  "bg-gradient-to-b from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-600 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(147,51,234,0.6)]";

export const BOTAO_VERDE =
  "flex items-center justify-center gap-2 rounded-full font-semibold text-white transition-all duration-300 active:scale-95 " +
  "bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-600 " +
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-8px_rgba(16,185,129,0.6)]";

export const BOTAO_VIDRO =
  "flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-300 active:scale-95 " +
  "bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.13] " +
  "text-zinc-700 dark:text-zinc-200 border border-black/[0.06] dark:border-white/[0.08]";

export const SELO = {
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  rose: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  // Pedido de bonificação: lilás forte, para não passar batido
  lilas: 'bg-violet-500 text-white border-violet-500 shadow-[0_4px_12px_-4px_rgba(139,92,246,0.7)]',
};

// Fundo lilás do card do pedido de bonificação. Fica atrás do conteúdo (o vidro já isola as camadas).
export function FundoBonificado() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 rounded-[inherit] pointer-events-none bg-gradient-to-br from-violet-200/70 via-violet-100/50 to-teal-100/50 dark:from-violet-500/20 dark:via-violet-500/10 dark:to-teal-500/10"
    />
  );
}

export function LuzesDeFundo() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 left-1/4 w-[560px] h-[560px] rounded-full bg-purple-400/20 dark:bg-purple-600/10 blur-[120px]" />
      <div className="absolute top-1/3 -right-32 w-[480px] h-[480px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/10 blur-[120px]" />
    </div>
  );
}

const COR_DA_NOTIFICACAO = {
  purple: 'from-purple-500 to-purple-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_-6px_rgba(147,51,234,0.7)]',
  rose: 'from-rose-500 to-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_6px_14px_-6px_rgba(244,63,94,0.7)]',
};

// Notificação no estilo iOS, usada com toast.custom
export function NotificacaoVidro({ visivel, Icone, titulo, subtitulo, detalhe, cor = 'purple' }) {
  return (
    <div
      role="status"
      className={`${VIDRO} !rounded-[24px] !bg-white/90 dark:!bg-[#1c1c1e]/90 w-[380px] max-w-[calc(100vw-32px)] flex items-center gap-3.5 p-3.5 pr-5 font-sans antialiased`}
      style={{ animation: visivel ? 'notificacaoEntrada 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'notificacaoSaida 0.25s ease-in forwards' }}
    >
      <style>{`
        @keyframes notificacaoEntrada { from { opacity: 0; transform: translateY(-18px) scale(0.96); } to { opacity: 1; transform: none; } }
        @keyframes notificacaoSaida { to { opacity: 0; transform: translateY(-10px) scale(0.97); } }
      `}</style>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white bg-gradient-to-b ${COR_DA_NOTIFICACAO[cor]}`}>
        <Icone size={21} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white truncate">{titulo}</p>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 truncate">{subtitulo}</p>
        {detalhe && <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-300 truncate mt-0.5">{detalhe}</p>}
      </div>
    </div>
  );
}
