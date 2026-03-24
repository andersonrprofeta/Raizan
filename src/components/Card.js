export default function Card({ title, value }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-6 transition-all duration-300 hover:border-purple-500/50 hover:bg-zinc-800/40 hover:shadow-[0_0_30px_rgba(124,58,237,0.1)]">
      
      {/* Efeito de brilho de fundo no hover */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-500" />

      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <h3 className="text-3xl font-bold text-zinc-50 tracking-tight mt-2">{value}</h3>
    </div>
  );
}