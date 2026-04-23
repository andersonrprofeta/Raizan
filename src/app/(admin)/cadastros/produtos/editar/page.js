"use client";

import { useState, useEffect, Suspense } from "react";
// 🟢 MUDANÇA AQUI: Usando useSearchParams para o Electron funcionar!
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Save, Package, Layers, Box, FileText, Settings, Loader2, ClipboardList } from "lucide-react";
import Link from "next/link";
import toast from 'react-hot-toast';

import AbaBasico from "@/components/produtos/AbaBasico";
import AbaComplementar from "@/components/produtos/AbaComplementar";
import AbaFichaTecnica from "@/components/produtos/AbaFichaTecnica"; 
import AbaVariacoes from "@/components/produtos/AbaVariacoes";
import AbaKit from "@/components/produtos/AbaKit";

// 🟢 ENVOLVENDO EM UM COMPONENTE FILHO PARA O SUSPENSE DO NEXT.JS
function FormularioInterno() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Lê o ID da URL (?id=5)
  const idProduto = searchParams.get("id"); 
  const isEditMode = !!idProduto;

  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(isEditMode);
  const [abaAtiva, setAbaAtiva] = useState("basico");

  const [produto, setProduto] = useState({
    basico: { tipo_produto: "simples", nome: "", gtin: "", origem: "0", unidade: "UN", ncm: "", sku: "", cest: "" },
    precos: { venda: "", promocional: "" },
    dimensoes: { peso_liquido: "", peso_bruto: "", tipo_embalagem: "pacote", embalagem: "customizada", largura: "", altura: "", comprimento: "" },
    estoque: { controlar: "sim", inicial: "", minimo: "", maximo: "", localizacao: "", dias_preparacao: "" },
    complementares: { categoria: "", marca: "", tabela_medidas: "", descricao: "", link_video: "", slug: "", keywords: "", seo_titulo: "", seo_descricao: "", tags: "" },
    ficha_tecnica: { breve_descricao: "", garantia: "", composicao: "", cuidados: "", formula: "", atributos: [] },
    imagens_anexos: [],
    variacoes: [], 
    composicao_kit: []
  });

  useEffect(() => {
    if (isEditMode) {
      buscarProdutoParaEdicao();
    }
  }, [idProduto]);

  const buscarProdutoParaEdicao = async () => {
    try {
      const res = await fetch(`https://api.raizan.com.br/api/hub/produtos/${idProduto}`);
      const data = await res.json();
      if (data.success) {
        setProduto(data.produto);
      } else {
        toast.error("Produto não encontrado.");
        router.push('/cadastros/produtos');
      }
    } catch (error) {
      toast.error("Erro ao buscar dados do produto.");
    } finally {
      setCarregandoDados(false);
    }
  };

  const atualizarCampo = (sessao, campo, valor) => {
    // Se "valor" não existir, significa que a aba mandou apenas (gaveta, dados_completos)
    if (valor === undefined) {
      setProduto(prev => ({ ...prev, [sessao]: campo }));
    } else {
      // Se tiver os 3, atualiza linha por linha igual antes (ex: basico -> nome -> valor)
      setProduto(prev => ({ ...prev, [sessao]: { ...prev[sessao], [campo]: valor } }));
    }
  };

  const salvarProduto = async () => {
    setSalvando(true);
    
    // 🟢 GERADOR DE SKU AUTOMÁTICO COM ZEROS À ESQUERDA
    let produtoParaSalvar = { ...produto };
    if (!produtoParaSalvar.basico.sku || produtoParaSalvar.basico.sku.trim() === "") {
       // Gera um SKU aleatório tipo "00142" se estiver vazio
       const skuAleatorio = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
       produtoParaSalvar.basico.sku = skuAleatorio;
       toast.success(`SKU gerado automaticamente: ${skuAleatorio}`, { icon: '🔢' });
    }

    const url = isEditMode 
      ? `https://api.raizan.com.br/api/hub/produtos/${idProduto}` 
      : "https://api.raizan.com.br/api/hub/produtos";
      
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produtoParaSalvar) 
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        
        // Se for novo, vai pra tela de edição usando a Interrogação (Electron Friendly)
        if (!isEditMode && data.id) {
          router.push(`/cadastros/produtos/editar?id=${data.id}`);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Erro ao conectar com a nuvem.");
    } finally {
      setSalvando(false);
    }
  };

  const tipo = produto.basico.tipo_produto;

  const abas = [
    { id: "basico", label: "Dados Básicos", icon: <Package size={18} /> },
    { id: "complementares", label: "Dados Complementares", icon: <FileText size={18} /> },
    { id: "ficha_tecnica", label: "Ficha Técnica", icon: <ClipboardList size={18} /> },
    ...(tipo === "variacoes" ? [{ id: "variacoes", label: "Variações (Grade)", icon: <Layers size={18} /> }] : []),
    ...(tipo === "kit" ? [{ id: "kit", label: "Composição do Kit", icon: <Box size={18} /> }] : []),
    ...(tipo === "materia-prima" ? [{ id: "materia", label: "Ficha Técnica", icon: <Settings size={18} /> }] : []),
  ];

  if (carregandoDados) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-[#09090b]">
        <div className="flex flex-col items-center gap-4 text-purple-600">
          <Loader2 size={40} className="animate-spin" />
          <p className="font-bold text-zinc-600 dark:text-zinc-400">Carregando cofre do produto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-[#0c0c0e] p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800/60 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors duration-300 gap-4">
              <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 dark:bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 w-full sm:w-auto">
                <Link href="/cadastros/produtos" className="text-zinc-500 dark:text-zinc-400 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-2 text-sm mb-3 font-medium transition-all w-fit">
                  <ArrowLeft size={16} /> Voltar para o Catálogo
                </Link>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center border border-purple-200 dark:border-purple-500/20 transition-colors">
                    <Package size={28} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {isEditMode ? `Editando: ${produto.basico.nome}` : "Cadastrar Novo Produto"}
                  </h1>
                </div>
              </div>

              <button 
                onClick={salvarProduto} disabled={salvando}
                className="w-full sm:w-auto relative z-10 bg-purple-600 hover:bg-purple-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {salvando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isEditMode ? "Atualizar Produto" : "Salvar no Hub"}
              </button>
            </div>

            <div className="flex flex-col gap-6">
              <div className="w-full bg-zinc-200/50 dark:bg-zinc-900/20 p-2 rounded-2xl border border-zinc-300/50 dark:border-zinc-800/60 flex flex-row gap-2 overflow-x-auto custom-scrollbar">
                {abas.map((aba) => (
                  <button key={aba.id} onClick={() => setAbaAtiva(aba.id)} className={`flex-1 min-w-[200px] flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === aba.id ? "bg-white dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-zinc-200 dark:border-purple-500/30 shadow-sm" : "bg-transparent text-zinc-500 border-transparent hover:bg-white/50 dark:hover:bg-zinc-800/50"}`}>
                    {aba.icon} {aba.label}
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-md dark:shadow-2xl min-h-[500px] relative">
                {abaAtiva === "basico" && <AbaBasico produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "complementares" && <AbaComplementar produto={produto} atualizarCampo={atualizarCampo} setProduto={setProduto} isEditMode={isEditMode} />}
                {abaAtiva === "ficha_tecnica" && <AbaFichaTecnica produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "variacoes" && <AbaVariacoes produto={produto} atualizarCampo={atualizarCampo} />}
                {abaAtiva === "kit" && <AbaKit produto={produto} atualizarCampo={atualizarCampo} />}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// 🟢 EXPORTAÇÃO ENVOLVIDA EM SUSPENSE PARA EVITAR ERROS NO BUILD DO NEXT.JS
export default function FormularioProdutoHub() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-purple-600" /></div>}>
      <FormularioInterno />
    </Suspense>
  );
}