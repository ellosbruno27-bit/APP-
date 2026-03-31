import { useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  DollarSign,
  Percent,
  Clock,
  Filter,
  ToggleLeft,
  ToggleRight,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  loadProdutos,
  addProduto,
  updateProduto,
  deleteProduto,
  loadBancos,
  addBanco,
  updateBanco,
  deleteBanco,
} from "@/lib/store";
import {
  formatCurrency,
  productCategoryLabels,
  productCategoryColors,
} from "@/lib/data";
import type { Produto, ProductCategory, Banco } from "@/lib/data";

const ALL_CATEGORIES: ProductCategory[] = [
  "consorcio",
  "financiamento",
  "emprestimo",
  "capital_giro",
  "seguro",
  "previdencia",
  "cambio",
  "cartao",
  "investimento",
];

// ── Form types ──
interface ProductFormData {
  nome: string;
  bancoId: string;
  categoria: ProductCategory;
  valorMin: string;
  valorMax: string;
  descricao: string;
  taxa: string;
  prazo: string;
}

interface BankFormData {
  nome: string;
  cor: string;
}

const PRESET_COLORS = ["#0066CC", "#CC2229", "#FF6600", "#EE1D23", "#FFCC00", "#00A651", "#7B2D8E", "#003DA5", "#D4AF37", "#14B8A6"];

export default function Produtos() {
  // Data state
  const [bancos, setBancos] = useState<Banco[]>(() => loadBancos());
  const [produtos, setProdutos] = useState<Produto[]>(() => loadProdutos());

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ProductCategory | "all">("all");
  const [filterBanco, setFilterBanco] = useState<string>("all");

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormData>({
    nome: "",
    bancoId: "",
    categoria: "consorcio",
    valorMin: "",
    valorMax: "",
    descricao: "",
    taxa: "",
    prazo: "",
  });

  // Bank form
  const [showBankForm, setShowBankForm] = useState(false);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [bankForm, setBankForm] = useState<BankFormData>({ nome: "", cor: PRESET_COLORS[0] });

  // UI state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteBankConfirm, setDeleteBankConfirm] = useState<string | null>(null);
  const [collapsedBanks, setCollapsedBanks] = useState<Set<string>>(new Set());

  // ── Filtered products ──
  const filtered = useMemo(() => {
    return produtos.filter((p) => {
      const matchSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === "all" || p.categoria === filterCategory;
      const matchBanco = filterBanco === "all" || p.bancoId === filterBanco;
      return matchSearch && matchCategory && matchBanco;
    });
  }, [produtos, searchTerm, filterCategory, filterBanco]);

  // ── Grouped by bank ──
  const groupedByBank = useMemo(() => {
    const groups: { banco: Banco; produtos: Produto[] }[] = [];
    const bancoMap = new Map(bancos.map((b) => [b.id, b]));

    // Group filtered products by bank
    const bankProductMap = new Map<string, Produto[]>();
    for (const p of filtered) {
      const list = bankProductMap.get(p.bancoId) || [];
      list.push(p);
      bankProductMap.set(p.bancoId, list);
    }

    // Build groups in bank order
    for (const banco of bancos) {
      const prods = bankProductMap.get(banco.id);
      if (prods && prods.length > 0) {
        groups.push({ banco, produtos: prods });
      }
    }

    // Products with unknown bank
    const knownIds = new Set(bancos.map((b) => b.id));
    const orphan = filtered.filter((p) => !knownIds.has(p.bancoId));
    if (orphan.length > 0) {
      groups.push({
        banco: { id: "__orphan__", nome: "Sem Banco", cor: "#64748B", ativo: true, criadoEm: "" },
        produtos: orphan,
      });
    }

    return { groups, bancoMap };
  }, [filtered, bancos]);

  // ── Stats ──
  const stats = useMemo(() => {
    return {
      totalBancos: bancos.length,
      totalProdutos: produtos.length,
      produtosAtivos: produtos.filter((p) => p.ativo).length,
      categorias: new Set(produtos.map((p) => p.categoria)).size,
    };
  }, [bancos, produtos]);

  // ── Toggle bank collapse ──
  const toggleBankCollapse = (bankId: string) => {
    setCollapsedBanks((prev) => {
      const next = new Set(prev);
      if (next.has(bankId)) next.delete(bankId);
      else next.add(bankId);
      return next;
    });
  };

  // ── Product CRUD ──
  const openAddProduct = (bancoId?: string) => {
    setProductForm({
      nome: "",
      bancoId: bancoId || bancos[0]?.id || "",
      categoria: "consorcio",
      valorMin: "",
      valorMax: "",
      descricao: "",
      taxa: "",
      prazo: "",
    });
    setEditingProductId(null);
    setShowProductForm(true);
  };

  const openEditProduct = (produto: Produto) => {
    setProductForm({
      nome: produto.nome,
      bancoId: produto.bancoId,
      categoria: produto.categoria,
      valorMin: produto.valorMin?.toString() ?? "",
      valorMax: produto.valorMax?.toString() ?? "",
      descricao: produto.descricao,
      taxa: produto.taxa?.toString() ?? "",
      prazo: produto.prazo,
    });
    setEditingProductId(produto.id);
    setShowProductForm(true);
  };

  const handleSaveProduct = () => {
    if (!productForm.nome.trim() || !productForm.bancoId) return;
    const now = new Date().toISOString();

    if (editingProductId) {
      const updated = updateProduto(editingProductId, {
        nome: productForm.nome.trim(),
        bancoId: productForm.bancoId,
        categoria: productForm.categoria,
        valorMin: productForm.valorMin ? parseFloat(productForm.valorMin) : null,
        valorMax: productForm.valorMax ? parseFloat(productForm.valorMax) : null,
        descricao: productForm.descricao.trim(),
        taxa: productForm.taxa ? parseFloat(productForm.taxa) : null,
        prazo: productForm.prazo.trim(),
      });
      setProdutos(updated);
    } else {
      const newProduto: Produto = {
        id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bancoId: productForm.bancoId,
        nome: productForm.nome.trim(),
        categoria: productForm.categoria,
        valorMin: productForm.valorMin ? parseFloat(productForm.valorMin) : null,
        valorMax: productForm.valorMax ? parseFloat(productForm.valorMax) : null,
        descricao: productForm.descricao.trim(),
        taxa: productForm.taxa ? parseFloat(productForm.taxa) : null,
        prazo: productForm.prazo.trim(),
        ativo: true,
        criadoEm: now,
        atualizadoEm: now,
      };
      const updated = addProduto(newProduto);
      setProdutos(updated);
    }
    setShowProductForm(false);
    setEditingProductId(null);
  };

  const handleDeleteProduct = (id: string) => {
    setProdutos(deleteProduto(id));
    setDeleteConfirm(null);
  };

  const handleToggleAtivo = (produto: Produto) => {
    setProdutos(updateProduto(produto.id, { ativo: !produto.ativo }));
  };

  // ── Bank CRUD ──
  const openAddBank = () => {
    setBankForm({ nome: "", cor: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    setEditingBankId(null);
    setShowBankForm(true);
  };

  const openEditBank = (banco: Banco) => {
    setBankForm({ nome: banco.nome, cor: banco.cor });
    setEditingBankId(banco.id);
    setShowBankForm(true);
  };

  const handleSaveBank = () => {
    if (!bankForm.nome.trim()) return;
    if (editingBankId) {
      setBancos(updateBanco(editingBankId, { nome: bankForm.nome.trim(), cor: bankForm.cor }));
    } else {
      const newBank: Banco = {
        id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        nome: bankForm.nome.trim(),
        cor: bankForm.cor,
        ativo: true,
        criadoEm: new Date().toISOString(),
      };
      setBancos(addBanco(newBank));
    }
    setShowBankForm(false);
    setEditingBankId(null);
  };

  const handleDeleteBank = (id: string) => {
    setBancos(deleteBanco(id));
    // Also remove products of this bank
    const remaining = produtos.filter((p) => p.bancoId !== id);
    remaining.forEach(() => {}); // iterate to ensure filter completes
    // Delete each product individually to keep localStorage in sync
    produtos.filter((p) => p.bancoId === id).forEach((p) => deleteProduto(p.id));
    setProdutos(loadProdutos());
    setDeleteBankConfirm(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center">
              <Package size={20} className="text-[#0F172A]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Produtos</h1>
              <p className="text-sm text-[#94A3B8]">
                Gerencie produtos organizados por banco parceiro
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openAddBank}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] font-medium text-sm hover:bg-[#D4AF37]/10 transition-all"
          >
            <Building2 size={16} />
            Novo Banco
          </button>
          <button
            onClick={() => openAddProduct()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] text-[#0F172A] font-semibold text-sm hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bancos", value: stats.totalBancos, icon: <Building2 size={16} /> },
          { label: "Produtos", value: stats.totalProdutos, icon: <Package size={16} /> },
          { label: "Ativos", value: stats.produtosAtivos, icon: <Check size={16} /> },
          { label: "Categorias", value: stats.categorias, icon: <Filter size={16} /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-[#1E293B]/60 backdrop-blur-sm border border-[#334155]/50 rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
              {stat.icon}
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-[#94A3B8] uppercase">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar produto por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1E293B]/60 border border-[#334155]/50 rounded-xl text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
          />
        </div>
        <select
          value={filterBanco}
          onChange={(e) => setFilterBanco(e.target.value)}
          className="px-4 py-2.5 bg-[#1E293B]/60 border border-[#334155]/50 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="all">Todos Bancos</option>
          {bancos.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nome}
            </option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as ProductCategory | "all")}
          className="px-4 py-2.5 bg-[#1E293B]/60 border border-[#334155]/50 rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="all">Todas Categorias</option>
          {ALL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {productCategoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped by Bank */}
      {groupedByBank.groups.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="mx-auto text-[#334155] mb-4" />
          <p className="text-[#64748B] text-lg">Nenhum produto encontrado</p>
          <p className="text-[#475569] text-sm mt-1">
            {searchTerm || filterCategory !== "all" || filterBanco !== "all"
              ? "Tente ajustar os filtros"
              : 'Clique em "Novo Produto" para começar'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByBank.groups.map(({ banco, produtos: bankProducts }) => {
            const isCollapsed = collapsedBanks.has(banco.id);
            return (
              <div
                key={banco.id}
                className="bg-[#1E293B]/40 backdrop-blur-sm border border-[#334155]/50 rounded-2xl overflow-hidden"
              >
                {/* Bank Header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[#1E293B]/60 transition-colors"
                  onClick={() => toggleBankCollapse(banco.id)}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: banco.cor + "30", color: banco.cor }}
                  >
                    {banco.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-semibold text-base truncate">{banco.nome}</h2>
                    <p className="text-xs text-[#94A3B8]">
                      {bankProducts.length} produto{bankProducts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {banco.id !== "__orphan__" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditBank(banco);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-[#D4AF37] transition-colors"
                          title="Editar banco"
                        >
                          <Edit2 size={14} />
                        </button>
                        {deleteBankConfirm === banco.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] text-[#EF4444]">Excluir?</span>
                            <button
                              onClick={() => handleDeleteBank(banco.id)}
                              className="p-1 rounded bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteBankConfirm(null)}
                              className="p-1 rounded bg-[#334155]/50 text-[#94A3B8] hover:bg-[#334155]"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteBankConfirm(banco.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                            title="Excluir banco"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddProduct(banco.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-[#D4AF37]/10 text-[#94A3B8] hover:text-[#D4AF37] transition-colors"
                          title="Adicionar produto neste banco"
                        >
                          <Plus size={14} />
                        </button>
                      </>
                    )}
                    {isCollapsed ? (
                      <ChevronRight size={18} className="text-[#64748B]" />
                    ) : (
                      <ChevronDown size={18} className="text-[#64748B]" />
                    )}
                  </div>
                </div>

                {/* Products Grid */}
                {!isCollapsed && (
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {bankProducts.map((produto) => {
                        const catColor = productCategoryColors[produto.categoria];
                        return (
                          <div
                            key={produto.id}
                            className={`bg-[#0F172A]/60 border rounded-xl p-4 transition-all duration-200 hover:shadow-[0_0_15px_rgba(212,175,55,0.06)] ${
                              produto.ativo
                                ? "border-[#334155]/40 hover:border-[#D4AF37]/20"
                                : "border-[#334155]/20 opacity-50"
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-medium text-sm truncate">
                                  {produto.nome}
                                </h3>
                                <span
                                  className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{ backgroundColor: catColor.bg, color: catColor.text }}
                                >
                                  {productCategoryLabels[produto.categoria]}
                                </span>
                              </div>
                              <button
                                onClick={() => handleToggleAtivo(produto)}
                                className="ml-2 flex-shrink-0"
                                title={produto.ativo ? "Desativar" : "Ativar"}
                              >
                                {produto.ativo ? (
                                  <ToggleRight size={24} className="text-[#22C55E]" />
                                ) : (
                                  <ToggleLeft size={24} className="text-[#64748B]" />
                                )}
                              </button>
                            </div>

                            {/* Description */}
                            <p className="text-[#94A3B8] text-xs mb-3 line-clamp-2 min-h-[32px]">
                              {produto.descricao || "Sem descrição"}
                            </p>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="flex items-center gap-1.5">
                                <DollarSign size={12} className="text-[#D4AF37] flex-shrink-0" />
                                <span className="text-[10px] text-white truncate">
                                  {produto.valorMin != null && produto.valorMax != null
                                    ? `${formatCurrency(produto.valorMin)} - ${formatCurrency(produto.valorMax)}`
                                    : produto.valorMin != null
                                    ? `A partir ${formatCurrency(produto.valorMin)}`
                                    : produto.valorMax != null
                                    ? `Até ${formatCurrency(produto.valorMax)}`
                                    : "A definir"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Percent size={12} className="text-[#D4AF37] flex-shrink-0" />
                                <span className="text-[10px] text-white">
                                  {produto.taxa != null ? `${produto.taxa}% a.m.` : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 col-span-2">
                                <Clock size={12} className="text-[#D4AF37] flex-shrink-0" />
                                <span className="text-[10px] text-white">
                                  {produto.prazo || "A definir"}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-[#334155]/30">
                              <button
                                onClick={() => openEditProduct(produto)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-medium hover:bg-[#D4AF37]/20 transition-colors"
                              >
                                <Edit2 size={11} />
                                Editar
                              </button>
                              {deleteConfirm === produto.id ? (
                                <div className="flex items-center gap-1 ml-auto">
                                  <span className="text-[10px] text-[#EF4444]">Confirmar?</span>
                                  <button
                                    onClick={() => handleDeleteProduct(produto.id)}
                                    className="p-1 rounded bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20"
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1 rounded bg-[#334155]/50 text-[#94A3B8] hover:bg-[#334155]"
                                  >
                                    <X size={11} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(produto.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EF4444]/10 text-[#EF4444] text-[10px] font-medium hover:bg-[#EF4444]/20 transition-colors ml-auto"
                                >
                                  <Trash2 size={11} />
                                  Excluir
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Product Modal ── */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#334155]">
              <h2 className="text-lg font-bold text-white">
                {editingProductId ? "Editar Produto" : "Novo Produto"}
              </h2>
              <button
                onClick={() => { setShowProductForm(false); setEditingProductId(null); }}
                className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Banco */}
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Banco Parceiro *
                </label>
                <select
                  value={productForm.bancoId}
                  onChange={(e) => setProductForm({ ...productForm, bancoId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>
                    Selecione o banco
                  </option>
                  {bancos.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>
              {/* Nome */}
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={productForm.nome}
                  onChange={(e) => setProductForm({ ...productForm, nome: e.target.value })}
                  placeholder="Ex: Financiamento de Imóvel"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                />
              </div>
              {/* Categoria */}
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Categoria *
                </label>
                <select
                  value={productForm.categoria}
                  onChange={(e) => setProductForm({ ...productForm, categoria: e.target.value as ProductCategory })}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm focus:outline-none focus:border-[#D4AF37]/50 transition-colors appearance-none cursor-pointer"
                >
                  {ALL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {productCategoryLabels[cat]}
                    </option>
                  ))}
                </select>
              </div>
              {/* Valor Min / Max */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                    Valor Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    value={productForm.valorMin}
                    onChange={(e) => setProductForm({ ...productForm, valorMin: e.target.value })}
                    placeholder="50.000"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                    Valor Máximo (R$)
                  </label>
                  <input
                    type="number"
                    value={productForm.valorMax}
                    onChange={(e) => setProductForm({ ...productForm, valorMax: e.target.value })}
                    placeholder="500.000"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
              </div>
              {/* Taxa / Prazo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                    Taxa (% a.m.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.taxa}
                    onChange={(e) => setProductForm({ ...productForm, taxa: e.target.value })}
                    placeholder="1.5"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                    Prazo
                  </label>
                  <input
                    type="text"
                    value={productForm.prazo}
                    onChange={(e) => setProductForm({ ...productForm, prazo: e.target.value })}
                    placeholder="12 a 60 meses"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                  />
                </div>
              </div>
              {/* Descrição */}
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Descrição
                </label>
                <textarea
                  value={productForm.descricao}
                  onChange={(e) => setProductForm({ ...productForm, descricao: e.target.value })}
                  placeholder="Descreva o produto, condições, público-alvo..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#334155]">
              <button
                onClick={() => { setShowProductForm(false); setEditingProductId(null); }}
                className="px-5 py-2.5 rounded-xl border border-[#334155] text-[#94A3B8] text-sm font-medium hover:bg-[#334155]/50 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={!productForm.nome.trim() || !productForm.bancoId}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] text-[#0F172A] text-sm font-semibold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingProductId ? "Salvar Alterações" : "Criar Produto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bank Modal ── */}
      {showBankForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-[#334155]">
              <h2 className="text-lg font-bold text-white">
                {editingBankId ? "Editar Banco" : "Novo Banco"}
              </h2>
              <button
                onClick={() => { setShowBankForm(false); setEditingBankId(null); }}
                className="p-1.5 rounded-lg hover:bg-[#334155] text-[#94A3B8] hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Nome do Banco *
                </label>
                <input
                  type="text"
                  value={bankForm.nome}
                  onChange={(e) => setBankForm({ ...bankForm, nome: e.target.value })}
                  placeholder="Ex: Banco Caixa"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#334155] rounded-xl text-white text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94A3B8] mb-1.5 uppercase tracking-wider">
                  Cor do Banco
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setBankForm({ ...bankForm, cor: color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        bankForm.cor === color
                          ? "border-white scale-110"
                          : "border-transparent hover:border-[#64748B]"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#334155]">
              <button
                onClick={() => { setShowBankForm(false); setEditingBankId(null); }}
                className="px-5 py-2.5 rounded-xl border border-[#334155] text-[#94A3B8] text-sm font-medium hover:bg-[#334155]/50 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBank}
                disabled={!bankForm.nome.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#FDE68A] text-[#0F172A] text-sm font-semibold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editingBankId ? "Salvar Alterações" : "Criar Banco"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}