import { useState, useMemo, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Afiliado, CategoriaAfiliado, Lead, ServiceType, Produto } from "@/lib/data";
import { landingPages, productTypes, leadOrigins, formatCurrency } from "@/lib/data";
import {
  loadAfiliados,
  addAfiliado,
  updateAfiliado,
  deleteAfiliado,
  loadCategoriasAfiliado,
  addCategoriaAfiliado,
  deleteCategoriaAfiliado,
  loadProdutos,
  addLead,
  setLeadAfiliado,
  loadWhatsAppTemplate,
} from "@/lib/store";
import {
  UserPlus,
  Pencil,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  Plus,
  Handshake,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  Tag,
  Send,
  Package,
  MessageCircle,
  QrCode,
  Copy,
  Download,
  Share2,
  Link2,
} from "lucide-react";

type ViewMode = "lista" | "cadastrar_lead";

interface LeadFormState {
  afiliadoId: string;
  nome: string;
  telefone: string;
  email: string;
  cpfCnpj: string;
  valorPretendido: string;
  servico: ServiceType | "";
  produtoId: string;
  prioridade: "alto" | "medio" | "baixo";
  landingPageId: string;
  origem: "google_ads" | "facebook_ads" | "rd_station" | "organico";
}

const emptyLeadForm: LeadFormState = {
  afiliadoId: "",
  nome: "",
  telefone: "",
  email: "",
  cpfCnpj: "",
  valorPretendido: "",
  servico: "",
  produtoId: "",
  prioridade: "medio",
  landingPageId: landingPages[0]?.id || "",
  origem: "organico",
};

// ── QR Code Modal ──
function QRCodeModal({
  afiliado,
  categoria,
  onClose,
}: {
  afiliado: Afiliado;
  categoria: CategoriaAfiliado | undefined;
  onClose: () => void;
}) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<"qrcode" | "link">("qrcode");

  // Generate a unique referral URL for this affiliate
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://centralbankmaximo.com";
  const referralUrl = `${baseUrl}/afiliado?ref=${afiliado.id}&nome=${encodeURIComponent(afiliado.nome)}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 512, 512);
        ctx.drawImage(img, 0, 0, 512, 512);

        // Add affiliate name at the bottom
        ctx.fillStyle = "#0F172A";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(afiliado.nome, 256, 490);
      }

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `qrcode-${afiliado.nome.replace(/\s+/g, "-").toLowerCase()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShareWhatsApp = () => {
    const phone = afiliado.telefone.replace(/\D/g, "");
    const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;
    const message = `Olá ${afiliado.nome}! 👋\n\nAqui está seu link exclusivo de indicação da CentralBankMaximo:\n\n${referralUrl}\n\nCompartilhe este link com seus clientes para indicar leads diretamente para nossa equipe. 🚀`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-lg">
              {categoria?.emoji || "👤"}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{afiliado.nome}</h3>
              <p className="text-[10px] text-[#94A3B8]">{categoria?.nome || "Afiliado"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Toggle: QR Code vs Link */}
        <div className="px-5 pt-4">
          <div className="flex gap-1 bg-[#0F172A] rounded-xl p-1">
            <button
              onClick={() => setShareMode("qrcode")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                shareMode === "qrcode"
                  ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <QrCode size={14} />
              QR Code
            </button>
            <button
              onClick={() => setShareMode("link")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                shareMode === "link"
                  ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <Link2 size={14} />
              Link
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {shareMode === "qrcode" ? (
            <>
              {/* QR Code Display */}
              <div ref={qrRef} className="flex justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={referralUrl}
                    size={220}
                    level="H"
                    includeMargin={false}
                    fgColor="#0F172A"
                    bgColor="#FFFFFF"
                  />
                </div>
              </div>
              <p className="text-center text-xs text-[#94A3B8]">
                Escaneie o QR Code para acessar o link de indicação
              </p>

              {/* Download QR Button */}
              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold text-sm rounded-xl transition-all border border-[#D4AF37]/20"
              >
                <Download size={16} />
                Baixar QR Code como Imagem
              </button>
            </>
          ) : (
            <>
              {/* Link Display */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
                <p className="text-[10px] text-[#94A3B8] mb-2 font-medium">Link de Indicação</p>
                <p className="text-xs text-[#D4AF37] break-all font-mono leading-relaxed">{referralUrl}</p>
              </div>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-bold text-sm rounded-xl transition-all border ${
                  copied
                    ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                    : "bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/20"
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Link Copiado!" : "Copiar Link"}
              </button>
            </>
          )}

          {/* Share via WhatsApp */}
          {afiliado.telefone && (
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(37,211,102,0.15)] hover:shadow-[0_0_25px_rgba(37,211,102,0.3)]"
            >
              <MessageCircle size={16} />
              Enviar via WhatsApp
            </button>
          )}
        </div>

        {/* Footer tip */}
        <div className="px-5 pb-5">
          <div className="bg-[#0F172A] rounded-xl p-3 flex items-start gap-2">
            <Share2 size={14} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-[#94A3B8] leading-relaxed">
              Envie o QR Code ou link para o afiliado. Quando um cliente escanear ou acessar o link, o lead será automaticamente vinculado a este afiliado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Afiliados() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>(() => loadAfiliados());
  const [categorias, setCategorias] = useState<CategoriaAfiliado[]>(() => loadCategoriasAfiliado());
  const [catFilter, setCatFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");

  // QR Code modal state
  const [qrAfiliado, setQrAfiliado] = useState<Afiliado | null>(null);

  // Add afiliado form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formNome, setFormNome] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTelefone, setEditTelefone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCategoriaId, setEditCategoriaId] = useState("");

  // Add category form
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatNome, setNewCatNome] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("📌");

  // Lead registration form
  const [leadForm, setLeadForm] = useState<LeadFormState>(emptyLeadForm);
  const [lastCreatedLead, setLastCreatedLead] = useState<{ lead: Lead; afiliado: Afiliado; produtoNome: string } | null>(null);

  // Products
  const produtos = useMemo(() => loadProdutos(), []);

  const getCatById = useCallback(
    (id: string) => categorias.find((c) => c.id === id),
    [categorias]
  );

  const filteredAfiliados = useMemo(() => {
    return afiliados
      .filter((a) => catFilter === "todos" || a.categoriaId === catFilter)
      .filter(
        (a) =>
          searchQuery === "" ||
          a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.telefone.includes(searchQuery)
      );
  }, [afiliados, catFilter, searchQuery]);

  const activeAfiliados = useMemo(() => afiliados.filter((a) => a.ativo), [afiliados]);

  const handleAdd = () => {
    if (!formNome.trim() || !formCategoriaId) return;
    const updated = addAfiliado({
      nome: formNome.trim(),
      telefone: formTelefone.trim(),
      email: formEmail.trim(),
      categoriaId: formCategoriaId,
      ativo: true,
    });
    setAfiliados(updated);
    setFormNome("");
    setFormTelefone("");
    setFormEmail("");
    setFormCategoriaId("");
    setShowAddForm(false);
  };

  const handleStartEdit = (a: Afiliado) => {
    setEditingId(a.id);
    setEditNome(a.nome);
    setEditTelefone(a.telefone);
    setEditEmail(a.email);
    setEditCategoriaId(a.categoriaId);
  };

  const handleSaveEdit = (id: string) => {
    if (!editNome.trim()) return;
    const updated = updateAfiliado(id, {
      nome: editNome.trim(),
      telefone: editTelefone.trim(),
      email: editEmail.trim(),
      categoriaId: editCategoriaId,
    });
    setAfiliados(updated);
    setEditingId(null);
  };

  const handleToggleAtivo = (id: string, currentAtivo: boolean) => {
    const updated = updateAfiliado(id, { ativo: !currentAtivo });
    setAfiliados(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAfiliado(id);
    setAfiliados(updated);
  };

  const handleAddCat = () => {
    if (!newCatNome.trim()) return;
    const updated = addCategoriaAfiliado(newCatNome.trim(), newCatEmoji);
    setCategorias(updated);
    setNewCatNome("");
    setNewCatEmoji("📌");
    setShowAddCat(false);
  };

  const handleDeleteCat = (id: string) => {
    const updated = deleteCategoriaAfiliado(id);
    setCategorias(updated);
  };

  // ── Lead Registration ──
  const updateLeadField = <K extends keyof LeadFormState>(field: K, value: LeadFormState[K]) => {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegisterLead = () => {
    if (!leadForm.afiliadoId || !leadForm.nome.trim() || !leadForm.telefone.trim() || !leadForm.servico) return;

    const afiliado = afiliados.find((a) => a.id === leadForm.afiliadoId);
    if (!afiliado) return;

    const produto = produtos.find((p) => p.id === leadForm.produtoId);

    const newLead: Lead = {
      id: `lead_afil_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nome: leadForm.nome.trim(),
      telefone: leadForm.telefone.trim(),
      email: leadForm.email.trim(),
      cpfCnpj: leadForm.cpfCnpj.trim() || undefined,
      valorPretendido: parseFloat(leadForm.valorPretendido) || 0,
      servico: leadForm.servico as ServiceType,
      status: "novo",
      prioridade: leadForm.prioridade,
      landingPageId: leadForm.landingPageId,
      origem: leadForm.origem,
      scoreEstimado: 600,
      relacaoParcelaRenda: 0.25,
      corretorId: null,
      criadoEm: new Date().toISOString(),
      ultimaInteracao: new Date().toISOString(),
      historico: [
        {
          data: new Date().toISOString(),
          acao: `Lead indicado pelo afiliado ${afiliado.nome}${produto ? ` — Produto: ${produto.nome}` : ""}`,
        },
      ],
    };

    addLead(newLead);
    setLeadAfiliado(newLead.id, afiliado.id);

    setLastCreatedLead({
      lead: newLead,
      afiliado,
      produtoNome: produto?.nome || (productTypes.find((pt) => pt.value === leadForm.servico)?.label || ""),
    });

    setLeadForm(emptyLeadForm);
  };

  const buildWhatsAppUrl = (afiliado: Afiliado, leadNome: string, produtoNome: string): string => {
    const template = loadWhatsAppTemplate();
    const phone = afiliado.telefone.replace(/\D/g, "");
    const phoneWithCountry = phone.startsWith("55") ? phone : `55${phone}`;
    const message = template
      .replace(/{nome_afiliado}/g, afiliado.nome)
      .replace(/{nome_lead}/g, leadNome)
      .replace(/{produto}/g, produtoNome);
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
  };

  // Stats
  const totalAtivos = afiliados.filter((a) => a.ativo).length;
  const totalInativos = afiliados.filter((a) => !a.ativo).length;
  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    afiliados.forEach((a) => {
      map[a.categoriaId] = (map[a.categoriaId] || 0) + 1;
    });
    return map;
  }, [afiliados]);

  return (
    <div className="space-y-6">
      {/* QR Code Modal */}
      {qrAfiliado && (
        <QRCodeModal
          afiliado={qrAfiliado}
          categoria={getCatById(qrAfiliado.categoriaId)}
          onClose={() => setQrAfiliado(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <Handshake size={24} className="text-[#D4AF37]" />
            Painel de Afiliados
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            Agentes indicadores de oportunidades — não participam da distribuição de leads
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setViewMode("cadastrar_lead"); setLastCreatedLead(null); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 border border-[#8B5CF6]/20"
          >
            <Send size={16} />
            <span className="hidden sm:inline">Cadastrar Lead</span>
            <span className="sm:hidden">Lead</span>
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setViewMode("lista"); }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C4A030] hover:from-[#E5C040] hover:to-[#D4AF37] text-[#0F172A] font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)]"
          >
            <UserPlus size={16} />
            <span className="hidden sm:inline">Novo Afiliado</span>
            <span className="sm:hidden">Novo</span>
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 bg-[#111827] border border-[#1E293B] rounded-xl p-1.5 overflow-x-auto">
        <button
          onClick={() => setViewMode("lista")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            viewMode === "lista"
              ? "bg-[#D4AF37]/10 text-[#D4AF37]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          }`}
        >
          <Handshake size={16} />
          Afiliados
        </button>
        <button
          onClick={() => { setViewMode("cadastrar_lead"); setLastCreatedLead(null); }}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
            viewMode === "cadastrar_lead"
              ? "bg-[#8B5CF6]/10 text-[#8B5CF6]"
              : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
          }`}
        >
          <Send size={16} />
          <span className="hidden sm:inline">Cadastrar Lead via Afiliado</span>
          <span className="sm:hidden">Cadastrar Lead</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* LEAD REGISTRATION VIEW */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === "cadastrar_lead" && (
        <div className="space-y-5">
          {/* Success Card */}
          {lastCreatedLead && (
            <div className="bg-gradient-to-r from-[#22C55E]/10 to-[#D4AF37]/10 border border-[#22C55E]/30 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#22C55E]/15 flex items-center justify-center flex-shrink-0">
                  <Check size={20} className="text-[#22C55E]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm">Lead Cadastrado com Sucesso!</h3>
                  <p className="text-xs text-[#94A3B8]">
                    <span className="text-white font-medium">{lastCreatedLead.lead.nome}</span> foi adicionado ao Feed de Leads, indicado por{" "}
                    <span className="text-[#D4AF37] font-medium">{lastCreatedLead.afiliado.nome}</span>
                    {lastCreatedLead.produtoNome && (
                      <> — Produto: <span className="text-[#8B5CF6] font-medium">{lastCreatedLead.produtoNome}</span></>
                    )}
                  </p>
                </div>
              </div>

              {/* WhatsApp Button */}
              {lastCreatedLead.afiliado.telefone && (
                <a
                  href={buildWhatsAppUrl(lastCreatedLead.afiliado, lastCreatedLead.lead.nome, lastCreatedLead.produtoNome)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)]"
                >
                  <MessageCircle size={18} />
                  Enviar Mensagem WhatsApp para {lastCreatedLead.afiliado.nome}
                </a>
              )}

              <button
                onClick={() => setLastCreatedLead(null)}
                className="text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                Cadastrar outro lead →
              </button>
            </div>
          )}

          {/* Lead Form */}
          {!lastCreatedLead && (
            <div className="bg-[#111827] border border-[#8B5CF6]/20 rounded-xl p-4 sm:p-5 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-[#1E293B]">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                  <Send size={18} className="text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Cadastrar Lead via Afiliado</h3>
                  <p className="text-xs text-[#94A3B8]">O afiliado indica um lead e recebe uma mensagem de confirmação no WhatsApp</p>
                </div>
              </div>

              {activeAfiliados.length === 0 ? (
                <div className="text-center py-8">
                  <Handshake size={40} className="mx-auto text-[#1E293B] mb-3" />
                  <p className="text-[#94A3B8] text-sm">Nenhum afiliado ativo cadastrado.</p>
                  <button
                    onClick={() => { setViewMode("lista"); setShowAddForm(true); }}
                    className="mt-3 px-4 py-2 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-xs rounded-lg transition-colors"
                  >
                    Cadastrar Afiliado Primeiro
                  </button>
                </div>
              ) : (
                <>
                  {/* Afiliado Selector */}
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Afiliado Indicador *</label>
                    <select
                      value={leadForm.afiliadoId}
                      onChange={(e) => updateLeadField("afiliadoId", e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#8B5CF6]/50"
                    >
                      <option value="">Selecionar afiliado...</option>
                      {activeAfiliados.map((a) => {
                        const cat = getCatById(a.categoriaId);
                        return (
                          <option key={a.id} value={a.id}>
                            {cat?.emoji || "👤"} {a.nome} — {cat?.nome || "Sem categoria"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Lead Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Nome do Lead *</label>
                      <input
                        type="text"
                        placeholder="Nome completo"
                        value={leadForm.nome}
                        onChange={(e) => updateLeadField("nome", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Telefone/WhatsApp *</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={leadForm.telefone}
                        onChange={(e) => updateLeadField("telefone", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">E-mail</label>
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={leadForm.email}
                        onChange={(e) => updateLeadField("email", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">CPF/CNPJ</label>
                      <input
                        type="text"
                        placeholder="000.000.000-00"
                        value={leadForm.cpfCnpj}
                        onChange={(e) => updateLeadField("cpfCnpj", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Valor Pretendido (R$)</label>
                      <input
                        type="number"
                        placeholder="100000"
                        value={leadForm.valorPretendido}
                        onChange={(e) => updateLeadField("valorPretendido", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Tipo de Serviço *</label>
                      <select
                        value={leadForm.servico}
                        onChange={(e) => updateLeadField("servico", e.target.value as ServiceType | "")}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="">Selecionar serviço...</option>
                        {productTypes.map((pt) => (
                          <option key={pt.value} value={pt.value}>{pt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Product Selection */}
                  <div>
                    <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium flex items-center gap-1.5">
                      <Package size={12} className="text-[#D4AF37]" />
                      Produto de Interesse
                    </label>
                    <select
                      value={leadForm.produtoId}
                      onChange={(e) => updateLeadField("produtoId", e.target.value)}
                      className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                    >
                      <option value="">Selecionar produto (opcional)...</option>
                      {produtos.filter((p) => p.ativo).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} {p.taxa ? `(${p.taxa}% a.m.)` : ""} {p.valorMin && p.valorMax ? `— ${formatCurrency(p.valorMin)} a ${formatCurrency(p.valorMax)}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Additional fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Prioridade</label>
                      <select
                        value={leadForm.prioridade}
                        onChange={(e) => updateLeadField("prioridade", e.target.value as "alto" | "medio" | "baixo")}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                      >
                        <option value="alto">🔥 Alto Padrão</option>
                        <option value="medio">⚡ Médio</option>
                        <option value="baixo">📋 Baixo</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Landing Page</label>
                      <select
                        value={leadForm.landingPageId}
                        onChange={(e) => updateLeadField("landingPageId", e.target.value)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                      >
                        {landingPages.map((lp) => (
                          <option key={lp.id} value={lp.id}>{lp.nome}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#94A3B8] mb-1.5 block font-medium">Origem</label>
                      <select
                        value={leadForm.origem}
                        onChange={(e) => updateLeadField("origem", e.target.value as typeof leadForm.origem)}
                        className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                      >
                        {leadOrigins.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                    <button
                      onClick={() => setLeadForm(emptyLeadForm)}
                      className="px-4 py-2.5 text-sm text-[#94A3B8] hover:text-white transition-colors"
                    >
                      Limpar
                    </button>
                    <button
                      onClick={handleRegisterLead}
                      disabled={!leadForm.afiliadoId || !leadForm.nome.trim() || !leadForm.telefone.trim() || !leadForm.servico}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#9B6CF6] hover:to-[#8B5CF6] text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                    >
                      <Send size={16} />
                      <span className="hidden sm:inline">Cadastrar Lead e Notificar Afiliado</span>
                      <span className="sm:hidden">Cadastrar Lead</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* AFILIADOS LIST VIEW */}
      {/* ═══════════════════════════════════════════ */}
      {viewMode === "lista" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <p className="text-2xl font-bold text-[#D4AF37]">{afiliados.length}</p>
              <p className="text-xs text-[#94A3B8]">Total Afiliados</p>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <p className="text-2xl font-bold text-[#22C55E]">{totalAtivos}</p>
              <p className="text-xs text-[#94A3B8]">Ativos</p>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <p className="text-2xl font-bold text-[#EF4444]">{totalInativos}</p>
              <p className="text-xs text-[#94A3B8]">Inativos</p>
            </div>
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4">
              <p className="text-2xl font-bold text-[#8B5CF6]">{categorias.length}</p>
              <p className="text-xs text-[#94A3B8]">Categorias</p>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="bg-[#111827] border border-[#D4AF37]/30 rounded-xl p-4 sm:p-5 space-y-4">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <UserPlus size={16} className="text-[#D4AF37]" />
                Cadastrar Novo Afiliado
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
                <input
                  type="text"
                  placeholder="Telefone/WhatsApp"
                  value={formTelefone}
                  onChange={(e) => setFormTelefone(e.target.value)}
                  className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
                <select
                  value={formCategoriaId}
                  onChange={(e) => setFormCategoriaId(e.target.value)}
                  className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                >
                  <option value="">Selecionar categoria *</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formNome.trim() || !formCategoriaId}
                  className="flex items-center gap-2 px-5 py-2 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-sm rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={14} />
                  Cadastrar
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-[#94A3B8] text-sm">
              <Filter size={16} />
              <span>Filtros</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="todos">Todas as Categorias</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.nome} ({catCounts[cat.id] || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatFilter(catFilter === cat.id ? "todos" : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  catFilter === cat.id
                    ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30"
                    : "bg-[#111827] text-[#94A3B8] border border-[#1E293B] hover:border-[#D4AF37]/20 hover:text-white"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.nome}</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#1E293B] text-[10px]">
                  {catCounts[cat.id] || 0}
                </span>
              </button>
            ))}
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111827] text-[#D4AF37] border border-dashed border-[#D4AF37]/30 hover:border-[#D4AF37]/60 transition-colors"
            >
              <Plus size={12} />
              Nova Categoria
            </button>
          </div>

          {/* Add Category Inline */}
          {showAddCat && (
            <div className="bg-[#111827] border border-[#D4AF37]/20 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <label className="text-xs text-[#94A3B8] mb-1 block">Nome da Categoria</label>
                <input
                  type="text"
                  placeholder="Ex: Consultores Financeiros"
                  value={newCatNome}
                  onChange={(e) => setNewCatNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCat()}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-[#94A3B8] mb-1 block">Emoji</label>
                <input
                  type="text"
                  value={newCatEmoji}
                  onChange={(e) => setNewCatEmoji(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white text-center focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddCat}
                  disabled={!newCatNome.trim()}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-xs rounded-lg transition-colors disabled:opacity-40"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-2 text-[#94A3B8] hover:text-white text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Manage Categories (collapsible) */}
          <details className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden">
            <summary className="px-5 py-3 cursor-pointer text-sm text-[#94A3B8] hover:text-white transition-colors flex items-center gap-2">
              <Tag size={14} className="text-[#D4AF37]" />
              Gerenciar Categorias ({categorias.length})
            </summary>
            <div className="px-5 pb-4 space-y-2">
              {categorias.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#0F172A]/50 group">
                  <span className="text-base">{cat.emoji}</span>
                  <span className="flex-1 text-sm text-white">{cat.nome}</span>
                  <span className="text-[10px] text-[#94A3B8]">{catCounts[cat.id] || 0} afiliados</span>
                  {(catCounts[cat.id] || 0) === 0 && (
                    <button
                      onClick={() => handleDeleteCat(cat.id)}
                      className="p-1.5 rounded text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </details>

          {/* Afiliados List */}
          <div className="space-y-2">
            {filteredAfiliados.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#1E293B] rounded-xl">
                <Handshake size={48} className="mx-auto text-[#1E293B] mb-4" />
                <p className="text-[#94A3B8]">
                  {afiliados.length === 0
                    ? "Nenhum afiliado cadastrado. Clique em \"Novo Afiliado\" para começar."
                    : "Nenhum afiliado encontrado com os filtros selecionados."}
                </p>
              </div>
            ) : (
              filteredAfiliados.map((a) => {
                const cat = getCatById(a.categoriaId);
                const isEditing = editingId === a.id;

                return (
                  <div
                    key={a.id}
                    className={`bg-[#111827] border rounded-xl p-3 sm:p-4 transition-all duration-200 group ${
                      a.ativo ? "border-[#1E293B]" : "border-[#1E293B] opacity-60"
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={editNome}
                            onChange={(e) => setEditNome(e.target.value)}
                            className="px-3 py-2 bg-[#0F172A] border border-[#D4AF37]/50 rounded-lg text-sm text-white focus:outline-none"
                            placeholder="Nome"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editTelefone}
                            onChange={(e) => setEditTelefone(e.target.value)}
                            className="px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                            placeholder="Telefone"
                          />
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                            placeholder="E-mail"
                          />
                          <select
                            value={editCategoriaId}
                            onChange={(e) => setEditCategoriaId(e.target.value)}
                            className="px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                          >
                            {categorias.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.emoji} {c.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSaveEdit(a.id)}
                            className="flex items-center gap-1 px-4 py-2 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 text-xs font-bold rounded-lg transition-colors"
                          >
                            <Check size={14} />
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 text-xs font-bold rounded-lg transition-colors"
                          >
                            <X size={14} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-lg flex-shrink-0">
                          {cat?.emoji || "👤"}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm text-white font-semibold">{a.nome}</span>
                            {cat && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37]">
                                {cat.emoji} {cat.nome}
                              </span>
                            )}
                            {!a.ativo && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/10 text-[#EF4444]">
                                Inativo
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                            {a.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone size={10} />
                                {a.telefone}
                              </span>
                            )}
                            {a.email && (
                              <span className="flex items-center gap-1 hidden sm:flex">
                                <Mail size={10} />
                                {a.email}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* QR Code / Share Button - always visible */}
                        <button
                          onClick={() => setQrAfiliado(a)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all flex-shrink-0"
                          title="QR Code / Link de Indicação"
                        >
                          <QrCode size={14} />
                          <span className="hidden sm:inline">Compartilhar</span>
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleAtivo(a.id, a.ativo)}
                            className={`p-2 rounded-lg transition-colors ${
                              a.ativo
                                ? "text-[#22C55E] hover:bg-[#22C55E]/10"
                                : "text-[#94A3B8] hover:bg-[#94A3B8]/10"
                            }`}
                            title={a.ativo ? "Desativar" : "Ativar"}
                          >
                            {a.ativo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          </button>
                          <button
                            onClick={() => handleStartEdit(a)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors hidden sm:block"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors hidden sm:block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}