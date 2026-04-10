export default function Card({ title, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-4 sm:p-6 transition-all duration-300 hover:border-purple-500/50 hover:bg-zinc-800/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]">
      
      {/* Efeito de brilho de fundo no hover responsivo */}
      <div className="absolute -right-8 -top-8 sm:-right-10 sm:-top-10 w-24 h-24 sm:w-32 sm:h-32 bg-purple-500/5 rounded-full blur-2xl sm:blur-3xl group-hover:bg-purple-500/10 transition-all duration-500" />

      {/* Título com truncate para não quebrar em telas pequenas */}
      <p className="text-xs sm:text-sm font-medium text-zinc-400 truncate">
        {title}
      </p>
      
      {/* Valor responsivo */}
      <h3 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight mt-1 sm:mt-2 truncate">
        {value}
      </h3>
    </div>
  );
}