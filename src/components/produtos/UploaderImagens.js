"use client";

import { useState, useRef } from "react";
import { UploadCloud, X, Image as ImageIcon, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function UploaderImagens({ imagens, setImagens }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Função que faz o envio real para a Nuvem
  const enviarParaNuvem = async (file) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("imagem", file);

    try {
      // 🟢 Bate na rota do Multer que acabamos de criar!
      // (Mude para localhost:3005 se estiver testando localmente)
      const res = await fetch("https://api.raizan.com.br/api/hub/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Adiciona a URL nova no array de imagens do produto
        setImagens([...imagens, data.url]);
        toast.success("Imagem enviada com sucesso!");
      } else {
        toast.error(data.message || "Erro ao fazer upload.");
      }
    } catch (error) {
      toast.error("Erro de conexão com o servidor de imagens.");
    } finally {
      setUploading(false);
    }
  };

  // Lida com o clique para selecionar arquivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) enviarParaNuvem(file);
  };

  // Lida com o "Arrastar e Soltar"
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) enviarParaNuvem(file);
  };

  // Remove a imagem do array
  const removerImagem = (indexParaRemover) => {
    setImagens(imagens.filter((_, index) => index !== indexParaRemover));
  };

  return (
    <div className="space-y-4 transition-colors">
      <label className="block text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2 flex items-center gap-2">
        <ImageIcon size={16} className="text-purple-600 dark:text-purple-400" />
        Fotos do Produto
      </label>

      {/* ÁREA DE DRAG & DROP */}
      <div
        className={`relative w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${
          isDragging
            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10"
            : "border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3 text-purple-600 dark:text-purple-400">
            <Loader2 size={32} className="animate-spin" />
            <span className="font-bold text-sm">Enviando para a Nuvem...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400 pointer-events-none">
            <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center shadow-sm border border-zinc-200 dark:border-zinc-800">
              <UploadCloud size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <p className="font-medium text-sm mt-2">
              <span className="text-purple-600 dark:text-purple-400">Clique para enviar</span> ou arraste a foto aqui
            </p>
            <p className="text-xs opacity-70">PNG, JPG ou WEBP até 5MB</p>
          </div>
        )}
      </div>

      {/* GALERIA DE FOTOS ENVIADAS */}
      {imagens.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-4">
          {imagens.map((url, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <img src={url} alt={`Produto ${index}`} className="w-full h-full object-cover" />
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <button 
                  onClick={() => removerImagem(index)}
                  className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all transform scale-90 group-hover:scale-100 shadow-lg"
                  title="Remover Imagem"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Selo de Foto Principal na primeira imagem */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md">
                  Capa
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}