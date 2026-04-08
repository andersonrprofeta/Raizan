"use client";
import { useState } from "react";
import { MessageSquare, X, Send, Paperclip, Image as ImageIcon } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* O BOTAO FLUTUANTE */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-purple-600 hover:bg-purple-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-purple-900/50 hover:scale-105 transition-all animate-in zoom-in"
        >
          <MessageSquare size={24} />
          {/* Bolinha vermelha de notificação */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-[#09090b] rounded-full"></span>
        </button>
      )}

      {/* A JANELA DO CHAT */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-[#0c0c0e] border border-zinc-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-200">
          
          {/* Header do Chat */}
          <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">R</div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-zinc-900 rounded-full"></span>
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">Suporte Rafany</p>
                <p className="text-xs text-zinc-400">Respondemos em até 1h</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300">
              <X size={20} />
            </button>
          </div>

          {/* Área de Mensagens */}
          <div className="h-72 bg-[#09090b] p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="text-center text-xs text-zinc-600 my-2">Hoje, 09:41</div>
            
            <div className="flex gap-2 w-3/4">
              <div className="w-6 h-6 rounded-full bg-purple-600 shrink-0 mt-1"></div>
              <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-none text-sm text-zinc-200">
                Olá! Sou o assistente da Rafany Distribuidora. Como posso ajudar com seu pedido B2B hoje?
              </div>
            </div>

            {/* Sugestões Rápidas */}
            <div className="flex flex-col gap-2 items-end mt-4">
               <button className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-xs px-4 py-2 rounded-full transition-colors">
                 Como envio o comprovante PIX?
               </button>
               <button className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 text-xs px-4 py-2 rounded-full transition-colors">
                 Qual o prazo de entrega FOB?
               </button>
            </div>
          </div>

          {/* Input de Digitação */}
          <div className="p-3 bg-zinc-900 border-t border-zinc-800">
            <div className="flex items-center gap-2 bg-[#09090b] border border-zinc-700 rounded-xl px-3 py-2">
              <input 
                type="text" 
                placeholder="Escreva sua mensagem..." 
                className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600"
              />
              <button className="text-zinc-500 hover:text-zinc-300"><ImageIcon size={18} /></button>
              <button className="text-zinc-500 hover:text-zinc-300"><Paperclip size={18} /></button>
              <button className="text-purple-500 hover:text-purple-400 ml-1"><Send size={18} /></button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}