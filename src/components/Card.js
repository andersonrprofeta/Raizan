export default function Card({ title, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-900/40 p-4 sm:p-6 transition-all duration-300 shadow-sm dark:shadow-none hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:bg-zinc-800/40">
      
      {/* Efeito de brilho de fundo no hover responsivo (Suave no claro, neon no escuro) */}
      <div className="absolute -right-8 -top-8 sm:-right-10 sm:-top-10 w-24 h-24 sm:w-32 sm:h-32 bg-purple-100 dark:bg-purple-500/5 rounded-full blur-2xl sm:blur-3xl group-hover:bg-purple-200 dark:group-hover:bg-purple-500/10 transition-all duration-500" />

      {/* Título com truncate para não quebrar em telas pequenas */}
      <p className="text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-400 truncate relative z-10 transition-colors">
        {title}
      </p>
      
      {/* Valor responsivo */}
      <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight mt-1 sm:mt-2 truncate relative z-10 transition-colors">
        {value}
      </h3>
    </div>
  );
}