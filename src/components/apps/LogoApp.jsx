import { Mail } from "lucide-react";

export default function LogoApp({ app, tamanho = 40 }) {
  const raio = Math.round(tamanho * 0.3);

  if (!app.logo) {
    return (
      <span className="flex shrink-0 items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]" style={{ width: tamanho, height: tamanho, borderRadius: raio }}>
        <Mail size={Math.round(tamanho * 0.5)} aria-hidden />
      </span>
    );
  }

  return (
    <span className="flex shrink-0 items-center justify-center bg-white ring-1 ring-black/5" style={{ width: tamanho, height: tamanho, borderRadius: raio, padding: Math.round(tamanho * 0.14) }}>
      <img src={app.logo} alt="" className="h-full w-full object-contain" />
    </span>
  );
}
