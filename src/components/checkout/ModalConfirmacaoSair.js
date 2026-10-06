"use client";

import { AlertTriangle } from 'lucide-react';

export default function ModalConfirmacaoSair({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-5 border border-amber-100 dark:border-amber-500/20">
          <AlertTriangle className="text-amber-600 dark:text-amber-400" size={28} />
        </div>
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Pausar Conferência?</h2>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          Você tem uma contagem em andamento! O progresso será <b>salvo automaticamente</b> para você continuar depois. Deseja fechar a tela?
        </p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel} 
            className="px-5 py-2.5 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Voltar
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20 transition-all active:scale-95"
          >
            Sim, Sair
          </button>
        </div>
      </div>
    </div>
  );
}