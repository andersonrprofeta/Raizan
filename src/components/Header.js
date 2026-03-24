export default function Header() {
  return (
    <header className="sticky top-0 z-30 w-full h-16 mt-8 bg-[#09090b]/80 backdrop-blur-md border-b border-zinc-800/60 flex items-center justify-between px-8 {{ WebkitAppRegion: 'drag' }}">
      <h2 className="text-lg font-medium text-zinc-100">Visão Geral</h2>

      <div className="flex items-center gap-5">
        <input
          type="text"
          placeholder="Buscar produtos..."
          className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2 rounded-lg text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all w-64 placeholder:text-zinc-500"
        />
        <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full cursor-pointer ring-2 ring-zinc-950 hover:ring-purple-500/50 transition-all" />
      </div>
    </header>
  );
}