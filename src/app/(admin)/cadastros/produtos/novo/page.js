"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Save, Package, Layers, Box, FileText, Settings, Loader2, ClipboardList } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

import AbaBasico from "@/components/produtos/AbaBasico";
import AbaComplementar from "@/components/produtos/AbaComplementar";
import AbaFichaTecnica from "@/components/produtos/AbaFichaTecnica"; // 🟢 Nossa nova aba importada!
import AbaVariacoes from "@/components/produtos/AbaVariacoes";
import AbaKit from "@/components/produtos/AbaKit";

export default function NovoProdutoHub() {
  const [salvando, setSalvando] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState("basico");

  // Nosso JSON gigante (Cofre)
  const [produto, setProduto] = useState({
    basico: { 
      tipo_produto: "simples", nome: "", gtin: "", origem: "0", 
      unidade: "UN", ncm: "", sku: "", cest: "" 
    },
    precos: { venda: "", promocional: "" },
    dimensoes: { 
      peso_liquido: "", peso_bruto: "", tipo_embalagem: "pacote", 
      embalagem: "customizada", largura: "", altura: "", comprimento: "" 
    },
    estoque: { 
      controlar: "sim", inicial: "", minimo: "", maximo: "", 
      localizacao: "", dias_preparacao: "" 
    },
    complementares: {
      categoria: "", marca: "", tabela_medidas: "",
      descricao: "", link_video: "", slug: "",
      keywords: "", seo_titulo: "", seo_descricao: "", tags: ""
    },
    ficha_tecnica: { 
      breve_descricao: "", garantia: "", composicao: "", 
      cuidados: "", formula: "", atributos: [] 
    },
    imagens_anexos: [],
    variacoes: [], 
    composicao_kit: []
  });

  const atualizarCampo = (sessao, campo, valor) => {
    setProduto(prev => ({ ...prev, [sessao]: { ...prev[sessao], [campo]: valor } }));
  };

  const salvarProduto = async () => {
    setSalvando(true);
    console.log("JSON QUE VAI PRO BANCO:", produto);
    setTimeout(() => {
      toast.success("Produto salvo com sucesso!");
      setSalvando(false);
    }, 1000);
  };

  // 🟢 A MÁGICA ACONTECE AQUI: Lógica de Abas Dinâmicas
  const tipo = produto.basico.tipo_produto;

  const abas = [
    { id: "basico", label: "Dados Básicos", icon: <Package size={18} /> },
    { id: "complementares", label: "Dados Complementares", icon: <FileText size={18} /> },
    { id: "ficha_tecnica", label: "Ficha Técnica", icon: <ClipboardList size={18} /> },
    // As abas abaixo SÓ aparecem se o tipo for selecionado na aba básica!
    ...(tipo === "variacoes" ? [{ id: "variacoes", label: "Variações (Grade)", icon: <Layers size={18} /> }] : []),
    ...(tipo === "kit" ? [{ id: "kit", label: "Composição do Kit", icon: <Box size={18} /> }] : []),
    ...(tipo === "materia-prima" ? [{ id: "materia", label: "Ficha Técnica", icon: <Settings size={18} /> }] : []),
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* CABEÇALHO NEON */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/40 p-6 rounded-2xl border border-zinc-800">
              <div>
                <Link href="/cadastros/produtos" className="text-zinc-500 hover:text-purple-400 flex items-center gap-2 text-sm mb-2 transition-all">
                  <ArrowLeft size={16} /> Voltar para o Catálogo
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                  <Package className="text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> 
                  Cadastrar Novo Produto
                </h1>
              </div>

              <button 
                onClick={salvarProduto}
                disabled={salvando}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all disabled:opacity-50"
              >
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar no Hub
              </button>
            </div>

            <div className="flex flex-col gap-6">
              
              {/* NAVEGAÇÃO SUPERIOR (ABAS HORIZONTAIS) */}
              <div className="w-full bg-zinc-900/20 p-2 rounded-2xl border border-zinc-800/60 flex flex-row gap-2 overflow-x-auto no-scrollbar">
                {abas.map((aba) => (
                  <button
                    key={aba.id}
                    onClick={() => setAbaAtiva(aba.id)}
                    className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                      abaAtiva === aba.id 
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-[inset_0_0_20px_rgba(168,85,247,0.1)]" 
                        : "bg-transparent text-zinc-400 border border-transparent hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    {aba.icon} {aba.label}
                  </button>
                ))}
              </div>

              {/* ÁREA DE CONTEÚDO */}
              <div className="bg-[#0c0c0e] border border-zinc-800 rounded-2xl p-6 shadow-2xl min-h-[500px]">
                
                {abaAtiva === "basico" && <AbaBasico produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "complementares" && <AbaComplementar produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "ficha_tecnica" && <AbaFichaTecnica produto={produto} atualizarCampo={atualizarCampo} />}

               {/* 🟢 Renderiza as novas abas quando ativas! */}
               {abaAtiva === "variacoes" && <AbaVariacoes produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "kit" && <AbaKit produto={produto} atualizarCampo={atualizarCampo} />}

                {/* Sobrou apenas o placeholder da Matéria-Prima que você ainda não pediu */}
                {['materia'].includes(abaAtiva) && (
                  <div className="flex flex-col items-center justify-center h-64 text-zinc-500 space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                     <Loader2 size={32} className="animate-spin opacity-20 text-purple-500" />
                     <p>Interface em construção para a aba dinâmica <b>{abaAtiva}</b>...</p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}