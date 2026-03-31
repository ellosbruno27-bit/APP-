import { useState, useMemo } from "react";
import {
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  ExternalLink,
  Edit2,
  Save,
  X,
  Search,
  Package,
  Key,
  Copy,
  Check,
  RefreshCw,
  Users,
  Handshake,
  Shield,
  Plus,
  Trash2,
  Globe,
  Link2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  loadProdutos,
  updateProduto,
  loadBancos,
  loadAfiliados,
  updateAfiliado,
  generateAccessCode,
  loadTreinamentoProdutos,
  addTreinamentoProduto,
  updateTreinamentoProduto,
  deleteTreinamentoProduto,
} from "@/lib/store";
import type { TreinamentoProduto } from "@/lib/store";
import { corretores as defaultCorretores } from "@/lib/data";
import type { Produto, Banco, Afiliado, ConteudoLink, ConteudoLinkTipo } from "@/lib/data";
import {
  productCategoryLabels,
  productCategoryColors,
  conteudoLinkTipoLabels,
  conteudoLinkTipoColors,
} from "@/lib/data";

type ActiveTab = "conteudos" | "treinamento_custom" | "senhas";

const LINK_TIPOS: ConteudoLinkTipo[] = ["ebook", "video", "explicacao", "landing_page", "outro"];

const ICONE_OPTIONS = [
  { value: "📦", label: "Produto" },
  { value: "🏦", label: "Banco" },
  { value: "💰", label: "Dinheiro" },
  { value: "🏠", label: "Imóvel" },
  { value: "🚗", label: "Veículo" },
  { value: "📊", label: "Gráfico" },
  { value: "🛡️", label: "Seguro" },
  { value: "💳", label: "Cartão" },
  { value: "📈", label: "Investimento" },
  { value: "🎓", label: "Educação" },
  { value: "⭐", label: "Destaque" },
  { value: "🔥", label: "Hot" },
];

interface LinkFormItem {
  id: string;
  tipo: ConteudoLinkTipo;
  titulo: string;
  url: string;
}

function newLinkItem(): LinkFormItem {
  return {
    id: `link_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    tipo: "ebook",
    titulo: "",
    url: "",
  };
}

export default function Treinamento() {
  const [produtos, setProdutos] = useState<Produto[]>(() => loadProdutos());
  const [bancos] = useState<Banco[]>(() => loadBancos());
  const [afiliados, setAfiliados] = useState<Afiliado[]>(() => loadAfiliados());
  const [treinamentoProdutos, setTreinamentoProdutos] = useState<TreinamentoProduto[]>(() => loadTreinamentoProdutos());
  const [activeTab, setActiveTab] = useState<ActiveTab>("conteudos");
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit links modal for existing products
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editLinks, setEditLinks] = useState<LinkFormItem[]>([]);

  // Add/Edit custom training product modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customForm, setCustomForm] = useState({
    nome: "",
    descricao: "",
    categoria: "",
    icone: "📦",
  });
  const [customLinks, setCustomLinks] = useState<LinkFormItem[]>([newLinkItem()]);

  // Confirm delete
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const bancoMap = useMemo(() => new Map(bancos.map((b) => [b.id, b])), [bancos]);

  const filteredProdutos = useMemo(() => {
    return produtos
      .filter((p) => p.ativo)
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [produtos, searchTerm]);

  const filteredCustom = useMemo(() => {
    return treinamentoProdutos.filter(
      (p) =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [treinamentoProdutos, searchTerm]);

  // Count products with content
  const withContent = produtos.filter(
    (p) => p.ativo && ((p.conteudoLinks && p.conteudoLinks.length > 0) || (p.conteudo && (p.conteudo.ebookUrl || p.conteudo.videoUrl || p.conteudo.explicacaoUrl)))
  ).length;

  // ── Existing product link editing ──
  const openEditLinks = (produto: Produto) => {
    // Migrate legacy conteudo to conteudoLinks if needed
    const existing: LinkFormItem[] = [];
    if (produto.conteudoLinks && produto.conteudoLinks.length > 0) {
      produto.conteudoLinks.forEach((l) => existing.push({ ...l, tipo: l.tipo as ConteudoLinkTipo }));
    } else if (produto.conteudo) {
      if (produto.conteudo.ebookUrl) existing.push({ id: `link_m1`, tipo: "ebook", titulo: "Ebook", url: produto.conteudo.ebookUrl });
      if (produto.conteudo.videoUrl) existing.push({ id: `link_m2`, tipo: "video", titulo: "Vídeos", url: produto.conteudo.videoUrl });
      if (produto.conteudo.explicacaoUrl) existing.push({ id: `link_m3`, tipo: "explicacao", titulo: "Explicações", url: produto.conteudo.explicacaoUrl });
    }
    if (existing.length === 0) existing.push(newLinkItem());
    setEditLinks(existing);
    setEditingProductId(produto.id);
  };

  const handleSaveLinks = () => {
    if (!editingProductId) return;
    const validLinks: ConteudoLink[] = editLinks
      .filter((l) => l.url.trim())
      .map((l) => ({
        id: l.id,
        tipo: l.tipo,
        titulo: l.titulo.trim() || conteudoLinkTipoLabels[l.tipo],
        url: l.url.trim(),
      }));
    const updated = updateProduto(editingProductId, { conteudoLinks: validLinks });
    setProdutos(updated);
    setEditingProductId(null);
  };

  // ── Custom training product CRUD ──
  const openAddCustom = () => {
    setEditingCustomId(null);
    setCustomForm({ nome: "", descricao: "", categoria: "", icone: "📦" });
    setCustomLinks([newLinkItem()]);
    setShowCustomModal(true);
  };

  const openEditCustom = (item: TreinamentoProduto) => {
    setEditingCustomId(item.id);
    setCustomForm({
      nome: item.nome,
      descricao: item.descricao,
      categoria: item.categoria,
      icone: item.icone,
    });
    const links: LinkFormItem[] = item.links.length > 0
      ? item.links.map((l) => ({ id: l.id, tipo: l.tipo as ConteudoLinkTipo, titulo: l.titulo, url: l.url }))
      : [newLinkItem()];
    setCustomLinks(links);
    setShowCustomModal(true);
  };

  const handleSaveCustom = () => {
    const validLinks = customLinks
      .filter((l) => l.url.trim())
      .map((l) => ({
        id: l.id,
        tipo: l.tipo,
        titulo: l.titulo.trim() || conteudoLinkTipoLabels[l.tipo as ConteudoLinkTipo] || l.tipo,
        url: l.url.trim(),
      }));

    if (editingCustomId) {
      const updated = updateTreinamentoProduto(editingCustomId, {
        nome: customForm.nome.trim(),
        descricao: customForm.descricao.trim(),
        categoria: customForm.categoria.trim(),
        icone: customForm.icone,
        links: validLinks,
      });
      setTreinamentoProdutos(updated);
    } else {
      const updated = addTreinamentoProduto({
        nome: customForm.nome.trim(),
        descricao: customForm.descricao.trim(),
        categoria: customForm.categoria.trim(),
        icone: customForm.icone,
        links: validLinks,
        ativo: true,
      });
      setTreinamentoProdutos(updated);
    }
    setShowCustomModal(false);
  };

  const handleDeleteCustom = (id: string) => {
    const updated = deleteTreinamentoProduto(id);
    setTreinamentoProdutos(updated);
    setConfirmDeleteId(null);
  };

  // ── Access codes ──
  const handleGenerateCode = (type: "afiliado" | "corretor", id: string, nome: string) => {
    const code = generateAccessCode(nome);
    if (type === "afiliado") {
      const updated = updateAfiliado(id, { codigoAcesso: code });
      setAfiliados(updated);
    }
    if (type === "corretor") {
      const key = `leadbank_corretor_codigo_${id}`;
      try { localStorage.setItem(key, code); } catch { /* ignore */ }
      setAfiliados([...afiliados]);
    }
  };

  const getCorretorCodigo = (id: string): string => {
    try {
      return localStorage.getItem(`leadbank_corretor_codigo_${id}`) || "";
    } catch {
      return "";
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProductLinks = (p: Produto): ConteudoLink[] => {
    if (p.conteudoLinks && p.conteudoLinks.length > 0) return p.conteudoLinks;
    // Legacy migration
    const links: ConteudoLink[] = [];
    if (p.conteudo?.ebookUrl) links.push({ id: "leg1", tipo: "ebook", titulo: "Ebook", url: p.conteudo.ebookUrl });
    if (p.conteudo?.videoUrl) links.push({ id: "leg2", tipo: "video", titulo: "Vídeos", url: p.conteudo.videoUrl });
    if (p.conteudo?.explicacaoUrl) links.push({ id: "leg3", tipo: "explicacao", titulo: "Explicações", url: p.conteudo.explicacaoUrl });
    return links;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#C084FC] flex items-center justify-center">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Máximo Conceito</h1>
            <p className="text-sm text-[#94A3B8]">
              Treinamento exclusivo — Ebooks, Vídeos e Conteúdos por Produto
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Produtos Banco", value: produtos.filter((p) => p.ativo).length, icon: <Package size={16} />, color: "#D4AF37" },
          { label: "Com Conteúdo", value: withContent + treinamentoProdutos.filter((t) => t.links.length > 0).length, icon: <BookOpen size={16} />, color: "#8B5CF6" },
          { label: "Personalizados", value: treinamentoProdutos.length, icon: <GraduationCap size={16} />, color: "#EC4899" },
          { label: "Total Links", value: produtos.reduce((acc, p) => acc + getProductLinks(p).length, 0) + treinamentoProdutos.reduce((acc, t) => acc + t.links.length, 0), icon: <Link2 size={16} />, color: "#22C55E" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1E293B]/60 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-3 flex items-center gap-3"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#111827] border border-[#1E293B] rounded-xl p-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab("conteudos")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "conteudos"
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          }`}
        >
          <Package size={16} />
          Produtos do Banco
        </button>
        <button
          onClick={() => setActiveTab("treinamento_custom")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "treinamento_custom"
              ? "bg-[#EC4899]/10 text-[#EC4899]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          }`}
        >
          <Plus size={16} />
          Meus Produtos
        </button>
        <button
          onClick={() => setActiveTab("senhas")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            activeTab === "senhas"
              ? "bg-[#D4AF37]/10 text-[#D4AF37]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          }`}
        >
          <Key size={16} />
          Senhas de Acesso
        </button>
      </div>

      {/* Search (shared) */}
      {(activeTab === "conteudos" || activeTab === "treinamento_custom") && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/60 border border-[#334155]/50 rounded-xl text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
          />
        </div>
      )}

      {/* ═══ CONTEÚDOS TAB (Existing Products) ═══ */}
      {activeTab === "conteudos" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProdutos.map((produto) => {
            const banco = bancoMap.get(produto.bancoId);
            const catColor = productCategoryColors[produto.categoria];
            const links = getProductLinks(produto);

            return (
              <div
                key={produto.id}
                className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] ${
                  links.length > 0 ? "border-[#8B5CF6]/20" : "border-[#1E293B]"
                }`}
              >
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {banco && (
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: banco.cor + "25", color: banco.cor }}
                          >
                            {banco.nome.charAt(0)}
                          </div>
                        )}
                        <h3 className="text-white font-semibold text-sm truncate">{produto.nome}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ backgroundColor: catColor.bg, color: catColor.text }}
                        >
                          {productCategoryLabels[produto.categoria]}
                        </span>
                        {banco && <span className="text-[10px] text-[#94A3B8]">{banco.nome}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => openEditLinks(produto)}
                      className="p-2 rounded-lg hover:bg-[#8B5CF6]/10 text-[#94A3B8] hover:text-[#8B5CF6] transition-colors flex-shrink-0"
                      title="Editar links"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                  <p className="text-[#94A3B8] text-xs line-clamp-2">{produto.descricao || "Sem descrição"}</p>
                </div>

                <div className="px-4 pb-4">
                  {links.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {links.map((link) => {
                        const colors = conteudoLinkTipoColors[link.tipo as ConteudoLinkTipo] || conteudoLinkTipoColors.outro;
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {link.titulo || conteudoLinkTipoLabels[link.tipo as ConteudoLinkTipo]}
                            <ExternalLink size={10} />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#475569] italic">
                      Nenhum conteúdo configurado. Clique no ✏️ para adicionar links.
                    </p>
                  )}
                  {links.length > 0 && (
                    <p className="text-[10px] text-[#475569] mt-1.5">{links.length} link(s) configurado(s)</p>
                  )}
                </div>
              </div>
            );
          })}
          {filteredProdutos.length === 0 && (
            <div className="col-span-2 text-center py-16">
              <Package size={48} className="mx-auto text-[#334155] mb-4" />
              <p className="text-[#64748B]">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ MEUS PRODUTOS TAB (Custom Training Products) ═══ */}
      {activeTab === "treinamento_custom" && (
        <div className="space-y-4">
          <button
            onClick={openAddCustom}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all"
          >
            <Plus size={16} />
            Adicionar Produto de Treinamento
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustom.map((item) => (
              <div
                key={item.id}
                className="bg-[#111827] border border-[#EC4899]/20 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-[0_0_20px_rgba(236,72,153,0.08)]"
              >
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xl flex-shrink-0">{item.icone}</span>
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">{item.nome}</h3>
                        {item.categoria && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EC4899]/10 text-[#EC4899]">
                            {item.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditCustom(item)}
                        className="p-2 rounded-lg hover:bg-[#8B5CF6]/10 text-[#94A3B8] hover:text-[#8B5CF6] transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      {confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteCustom(item.id)}
                            className="px-2 py-1 rounded-lg bg-[#EF4444]/20 text-[#EF4444] text-[10px] font-bold hover:bg-[#EF4444]/30 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 rounded-lg hover:bg-[#334155] text-[#94A3B8] transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-lg hover:bg-[#EF4444]/10 text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[#94A3B8] text-xs line-clamp-2">{item.descricao || "Sem descrição"}</p>
                </div>

                <div className="px-4 pb-4">
                  {item.links.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.links.map((link) => {
                        const colors = conteudoLinkTipoColors[link.tipo as ConteudoLinkTipo] || conteudoLinkTipoColors.outro;
                        return (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {link.titulo || conteudoLinkTipoLabels[link.tipo as ConteudoLinkTipo] || link.tipo}
                            <ExternalLink size={10} />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#475569] italic">Nenhum link adicionado.</p>
                  )}
                  <p className="text-[10px] text-[#475569] mt-1.5">{item.links.length} link(s)</p>
                </div>
              </div>
            ))}
          </div>

          {filteredCustom.length === 0 && !searchTerm && (
            <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
              <GraduationCap size={48} className="mx-auto text-[#334155] mb-4" />
              <p className="text-[#64748B] mb-2">Nenhum produto personalizado criado</p>
              <p className="text-xs text-[#475569]">Clique em &quot;Adicionar Produto de Treinamento&quot; para começar</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ SENHAS TAB ═══ */}
      {activeTab === "senhas" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#8B5CF6]/5 border border-[#D4AF37]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-medium mb-1">
              <Shield size={16} />
              Senhas de Acesso Exclusivo
            </div>
            <p className="text-xs text-[#94A3B8]">
              Cada corretor e afiliado recebe uma senha única para acessar os conteúdos de treinamento.
            </p>
          </div>

          {/* Corretores */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Users size={16} className="text-[#3B82F6]" />
              Corretores
            </h3>
            <div className="space-y-2">
              {defaultCorretores.filter((c) => c.ativo).map((corretor) => {
                const codigo = corretor.codigoAcesso || getCorretorCodigo(corretor.id);
                return (
                  <div key={corretor.id} className="flex items-center gap-3 bg-[#111827] border border-[#1E293B] rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] text-xs font-bold flex-shrink-0">
                      {corretor.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{corretor.nome}</p>
                      <p className="text-[10px] text-[#94A3B8]">{corretor.email}</p>
                    </div>
                    {codigo ? (
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-xs text-[#D4AF37] font-mono">{codigo}</code>
                        <button onClick={() => handleCopy(codigo, `cor_${corretor.id}`)} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors" title="Copiar">
                          {copiedId === `cor_${corretor.id}` ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => handleGenerateCode("corretor", corretor.id, corretor.nome)} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-[#F59E0B] transition-colors" title="Regenerar">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleGenerateCode("corretor", corretor.id, corretor.nome)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] text-xs font-medium hover:bg-[#3B82F6]/20 transition-colors">
                        <Key size={12} /> Gerar Senha
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Afiliados */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <Handshake size={16} className="text-[#22C55E]" />
              Afiliados
            </h3>
            {afiliados.filter((a) => a.ativo).length === 0 ? (
              <div className="text-center py-8 bg-[#111827] border border-[#1E293B] rounded-xl">
                <Handshake size={32} className="mx-auto text-[#334155] mb-2" />
                <p className="text-xs text-[#94A3B8]">Nenhum afiliado ativo cadastrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {afiliados.filter((a) => a.ativo).map((afiliado) => (
                  <div key={afiliado.id} className="flex items-center gap-3 bg-[#111827] border border-[#1E293B] rounded-xl p-3">
                    <div className="w-9 h-9 rounded-lg bg-[#22C55E]/10 flex items-center justify-center text-[#22C55E] text-xs font-bold flex-shrink-0">
                      {afiliado.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{afiliado.nome}</p>
                      <p className="text-[10px] text-[#94A3B8]">{afiliado.email}</p>
                    </div>
                    {afiliado.codigoAcesso ? (
                      <div className="flex items-center gap-2">
                        <code className="px-3 py-1.5 bg-[#0F172A] border border-[#334155] rounded-lg text-xs text-[#D4AF37] font-mono">{afiliado.codigoAcesso}</code>
                        <button onClick={() => handleCopy(afiliado.codigoAcesso!, `afil_${afiliado.id}`)} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors" title="Copiar">
                          {copiedId === `afil_${afiliado.id}` ? <Check size={14} className="text-[#22C55E]" /> : <Copy size={14} />}
                        </button>
                        <button onClick={() => handleGenerateCode("afiliado", afiliado.id, afiliado.nome)} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-[#F59E0B] transition-colors" title="Regenerar">
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleGenerateCode("afiliado", afiliado.id, afiliado.nome)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium hover:bg-[#22C55E]/20 transition-colors">
                        <Key size={12} /> Gerar Senha
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Links Modal (Existing Products) ── */}
      {editingProductId && (
        <LinksModal
          title="Configurar Links do Produto"
          links={editLinks}
          setLinks={setEditLinks}
          onSave={handleSaveLinks}
          onClose={() => setEditingProductId(null)}
        />
      )}

      {/* ── Add/Edit Custom Product Modal ── */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#334155] sticky top-0 bg-[#1E293B] z-10">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-[#EC4899]" />
                <h2 className="text-lg font-bold text-white">
                  {editingCustomId ? "Editar Produto" : "Novo Produto de Treinamento"}
                </h2>
              </div>
              <button onClick={() => setShowCustomModal(false)} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Product Info */}
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block uppercase tracking-wider">Ícone</label>
                  <div className="flex flex-wrap gap-1.5 max-w-[120px]">
                    {ICONE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setCustomForm({ ...customForm, icone: opt.value })}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all ${
                          customForm.icone === opt.value
                            ? "bg-[#EC4899]/20 ring-2 ring-[#EC4899] scale-110"
                            : "bg-[#0F172A] hover:bg-[#334155]"
                        }`}
                        title={opt.label}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block uppercase tracking-wider">Nome do Produto *</label>
                    <input
                      type="text"
                      value={customForm.nome}
                      onChange={(e) => setCustomForm({ ...customForm, nome: e.target.value })}
                      placeholder="Ex: Consórcio Imobiliário Premium"
                      className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#EC4899]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block uppercase tracking-wider">Categoria</label>
                    <input
                      type="text"
                      value={customForm.categoria}
                      onChange={(e) => setCustomForm({ ...customForm, categoria: e.target.value })}
                      placeholder="Ex: Consórcio, Financiamento, Seguro..."
                      className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#EC4899]/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block uppercase tracking-wider">Descrição</label>
                <textarea
                  value={customForm.descricao}
                  onChange={(e) => setCustomForm({ ...customForm, descricao: e.target.value })}
                  placeholder="Descrição do produto para treinamento..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#EC4899]/50 transition-colors resize-none"
                />
              </div>

              {/* Links */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs text-[#94A3B8] uppercase tracking-wider flex items-center gap-2">
                    <Link2 size={12} />
                    Links de Conteúdo
                  </label>
                  <button
                    onClick={() => setCustomLinks([...customLinks, newLinkItem()])}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#EC4899]/10 text-[#EC4899] text-[10px] font-medium hover:bg-[#EC4899]/20 transition-colors"
                  >
                    <Plus size={12} />
                    Adicionar Link
                  </button>
                </div>
                <div className="space-y-3">
                  {customLinks.map((link, idx) => (
                    <LinkRow
                      key={link.id}
                      link={link}
                      onChange={(updated) => {
                        const newLinks = [...customLinks];
                        newLinks[idx] = updated;
                        setCustomLinks(newLinks);
                      }}
                      onRemove={() => {
                        if (customLinks.length > 1) {
                          setCustomLinks(customLinks.filter((_, i) => i !== idx));
                        }
                      }}
                      canRemove={customLinks.length > 1}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#334155] sticky bottom-0 bg-[#1E293B]">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-5 py-2.5 rounded-xl border border-[#334155] text-[#94A3B8] text-sm font-medium hover:bg-[#334155]/50 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustom}
                disabled={!customForm.nome.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#EC4899] to-[#F472B6] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {editingCustomId ? "Salvar Alterações" : "Criar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable Links Modal ──
function LinksModal({
  title,
  links,
  setLinks,
  onSave,
  onClose,
}: {
  title: string;
  links: LinkFormItem[];
  setLinks: (links: LinkFormItem[]) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#334155] sticky top-0 bg-[#1E293B] z-10">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-[#8B5CF6]" />
            <h2 className="text-lg font-bold text-white">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#94A3B8]">
            Adicione quantos links quiser. Cada link pode ser um Ebook, Vídeo, Explicação, Landing Page ou outro tipo.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setLinks([...links, newLinkItem()])}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] text-xs font-medium hover:bg-[#8B5CF6]/20 transition-colors"
            >
              <Plus size={14} />
              Adicionar Link
            </button>
          </div>
          <div className="space-y-3">
            {links.map((link, idx) => (
              <LinkRow
                key={link.id}
                link={link}
                onChange={(updated) => {
                  const newLinks = [...links];
                  newLinks[idx] = updated;
                  setLinks(newLinks);
                }}
                onRemove={() => {
                  if (links.length > 1) {
                    setLinks(links.filter((_, i) => i !== idx));
                  }
                }}
                canRemove={links.length > 1}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-[#334155] sticky bottom-0 bg-[#1E293B]">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[#334155] text-[#94A3B8] text-sm font-medium hover:bg-[#334155]/50 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#C084FC] text-white text-sm font-semibold hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all"
          >
            <Save size={16} />
            Salvar Links
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single Link Row ──
function LinkRow({
  link,
  onChange,
  onRemove,
  canRemove,
}: {
  link: LinkFormItem;
  onChange: (updated: LinkFormItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={link.tipo}
          onChange={(e) => onChange({ ...link, tipo: e.target.value as ConteudoLinkTipo })}
          className="px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-white text-xs focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
        >
          {LINK_TIPOS.map((tipo) => (
            <option key={tipo} value={tipo}>
              {conteudoLinkTipoLabels[tipo]}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={link.titulo}
          onChange={(e) => onChange({ ...link, titulo: e.target.value })}
          placeholder="Título do link (opcional)"
          className="flex-1 px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#94A3B8] hover:text-[#EF4444] transition-colors flex-shrink-0"
            title="Remover link"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <input
        type="url"
        value={link.url}
        onChange={(e) => onChange({ ...link, url: e.target.value })}
        placeholder="https://conteudo.centralbankmaximo.com/..."
        className="w-full px-3 py-2 bg-[#1E293B] border border-[#334155] rounded-lg text-white text-xs placeholder:text-[#475569] focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
      />
    </div>
  );
}