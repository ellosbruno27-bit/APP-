import { useState, useMemo, useEffect } from "react";
import { landingPages, configuracoesMensagem } from "@/lib/data";
import type { Parceiro } from "@/lib/data";
import {
  loadParceiros,
  addParceiro,
  updateParceiro,
  deleteParceiro,
  loadWhatsAppTemplate,
  saveWhatsAppTemplate,
  DEFAULT_WHATSAPP_TEMPLATE,
} from "@/lib/store";
import {
  loadNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  type NotificationSettings,
} from "@/lib/notifications";
import {
  MessageSquare,
  Bell,
  Save,
  Link2,
  Webhook,
  Building2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  MessageCircle,
  RotateCcw,
  BellRing,
  Volume2,
  VolumeX,
  Shield,
  Smartphone,
} from "lucide-react";

type Tab = "mensagens" | "webhooks" | "notificacoes" | "parceiros" | "whatsapp_afiliado";

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<Tab>("parceiros");
  const [selectedLP, setSelectedLP] = useState(landingPages[0]?.id || "");

  // Parceiros state
  const [parceiros, setParceiros] = useState<Parceiro[]>(() => loadParceiros());
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<"banco" | "administradora">("banco");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editTipo, setEditTipo] = useState<"banco" | "administradora">("banco");

  // WhatsApp template state
  const [whatsappTemplate, setWhatsappTemplate] = useState(() => loadWhatsAppTemplate());
  const [templateSaved, setTemplateSaved] = useState(false);

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => loadNotificationSettings());
  const [notifSaved, setNotifSaved] = useState(false);
  const [permissionRequesting, setPermissionRequesting] = useState(false);

  // Sync permission state on mount and when tab becomes active
  useEffect(() => {
    if (activeTab === "notificacoes" && "Notification" in window) {
      setNotifSettings((prev) => ({
        ...prev,
        pushPermission: Notification.permission,
      }));
    }
  }, [activeTab]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "parceiros", label: "Gerenciar Parceiros", icon: <Building2 size={16} /> },
    { id: "whatsapp_afiliado", label: "WhatsApp Afiliados", icon: <MessageCircle size={16} /> },
    { id: "mensagens", label: "Mensagens Automáticas", icon: <MessageSquare size={16} /> },
    { id: "webhooks", label: "Webhooks", icon: <Webhook size={16} /> },
    { id: "notificacoes", label: "Notificações", icon: <Bell size={16} /> },
  ];

  const filteredMessages = configuracoesMensagem.filter((m) => m.landingPageId === selectedLP);

  const handleAddParceiro = () => {
    const trimmed = novoNome.trim();
    if (!trimmed) return;
    const updated = addParceiro(trimmed, novoTipo);
    setParceiros(updated);
    setNovoNome("");
  };

  const handleStartEdit = (p: Parceiro) => {
    setEditingId(p.id);
    setEditNome(p.nome);
    setEditTipo(p.tipo);
  };

  const handleSaveEdit = (id: string) => {
    const trimmed = editNome.trim();
    if (!trimmed) return;
    const updated = updateParceiro(id, { nome: trimmed, tipo: editTipo });
    setParceiros(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = deleteParceiro(id);
    setParceiros(updated);
  };

  const handleSaveTemplate = () => {
    saveWhatsAppTemplate(whatsappTemplate);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  const handleResetTemplate = () => {
    setWhatsappTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    saveWhatsAppTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
  };

  // ── Notification Settings Handlers ──
  const updateNotifSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const updated = { ...notifSettings, [key]: value };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  const handleRequestPermission = async () => {
    setPermissionRequesting(true);
    try {
      const permission = await requestNotificationPermission();
      const updated = {
        ...notifSettings,
        pushPermission: permission,
        pushEnabled: permission === "granted" ? notifSettings.pushEnabled : false,
      };
      setNotifSettings(updated);
      saveNotificationSettings(updated);
    } finally {
      setPermissionRequesting(false);
    }
  };

  const handleTestNotification = async () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      if (registration) {
        await registration.showNotification("🔥 Teste: Novo Lead!", {
          body: "Crédito Consignado via Google Ads — R$ 150.000",
          icon: "/favicon.svg",
          badge: "/favicon.svg",
          tag: "test-notification",
          requireInteraction: false,
        });
      } else {
        new Notification("🔥 Teste: Novo Lead!", {
          body: "Crédito Consignado via Google Ads — R$ 150.000",
          icon: "/favicon.svg",
          tag: "test-notification",
        });
      }
    } catch {
      // fallback
      new Notification("🔥 Teste: Novo Lead!", {
        body: "Crédito Consignado via Google Ads — R$ 150.000",
      });
    }
  };

  const bancos = useMemo(() => parceiros.filter((p) => p.tipo === "banco"), [parceiros]);
  const administradoras = useMemo(() => parceiros.filter((p) => p.tipo === "administradora"), [parceiros]);

  // Preview the template with sample data
  const templatePreview = whatsappTemplate
    .replace(/{nome_afiliado}/g, "Oaki Cell")
    .replace(/{nome_lead}/g, "Roberto Nascimento")
    .replace(/{produto}/g, "Financiamento de Imóvel");

  // Toggle component
  const Toggle = ({ enabled, onChange, disabled }: { enabled: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      className={`w-12 h-6 rounded-full relative transition-all duration-200 flex-shrink-0 ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-[#D4AF37]" : "bg-[#1E293B]"}`}
    >
      <div
        className={`w-5 h-5 rounded-full shadow-md absolute top-0.5 transition-all duration-200 ${
          enabled ? "right-0.5 bg-white" : "left-0.5 bg-[#94A3B8]"
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Configurações</h2>
        <p className="text-sm text-[#94A3B8]">Personalize parceiros, mensagens, webhooks e notificações</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#111827] border border-[#1E293B] rounded-xl p-1.5 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                : "text-[#94A3B8] hover:text-white hover:bg-[#1E293B]"
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── PARCEIROS TAB ─── */}
      {activeTab === "parceiros" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#FDE68A]/5 border border-[#D4AF37]/20 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Building2 size={18} className="text-[#D4AF37]" />
              Central de Parceiros
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Cadastre os Bancos e Administradoras de Consórcio com quem você trabalha. 
              Eles aparecerão no seletor de cada Lead para que o consultor marque qual instituição está cuidando do processo.
            </p>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h4 className="text-white font-semibold mb-4 text-sm">Adicionar Novo Parceiro</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Ex: Porto Seguro, Itaú, Canopus..."
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddParceiro()}
                className="flex-1 px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
              />
              <select
                value={novoTipo}
                onChange={(e) => setNovoTipo(e.target.value as "banco" | "administradora")}
                className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              >
                <option value="banco">🏦 Banco</option>
                <option value="administradora">📋 Administradora</option>
              </select>
              <button
                onClick={handleAddParceiro}
                disabled={!novoNome.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#C4A030] hover:from-[#E5C040] hover:to-[#D4AF37] text-[#0F172A] font-bold text-sm rounded-lg transition-all duration-200 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Plus size={16} />
                Adicionar
              </button>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h4 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              🏦 Bancos Parceiros
              <span className="text-[#D4AF37] text-xs font-normal">({bancos.length})</span>
            </h4>
            {bancos.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-6">
                Nenhum banco cadastrado. Adicione acima para começar.
              </p>
            ) : (
              <div className="space-y-2">
                {bancos.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50 hover:bg-[#1E293B] transition-colors group"
                  >
                    {editingId === p.id ? (
                      <>
                        <input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(p.id)}
                          className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#D4AF37]/50 rounded-lg text-sm text-white focus:outline-none"
                          autoFocus
                        />
                        <select
                          value={editTipo}
                          onChange={(e) => setEditTipo(e.target.value as "banco" | "administradora")}
                          className="px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none"
                        >
                          <option value="banco">Banco</option>
                          <option value="administradora">Administradora</option>
                        </select>
                        <button
                          onClick={() => handleSaveEdit(p.id)}
                          className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-sm flex-shrink-0">
                          🏦
                        </div>
                        <span className="flex-1 text-sm text-white font-medium">{p.nome}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h4 className="text-white font-semibold mb-4 text-sm flex items-center gap-2">
              📋 Administradoras de Consórcio
              <span className="text-[#D4AF37] text-xs font-normal">({administradoras.length})</span>
            </h4>
            {administradoras.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-6">
                Nenhuma administradora cadastrada. Adicione acima para começar.
              </p>
            ) : (
              <div className="space-y-2">
                {administradoras.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0F172A]/50 hover:bg-[#1E293B] transition-colors group"
                  >
                    {editingId === p.id ? (
                      <>
                        <input
                          type="text"
                          value={editNome}
                          onChange={(e) => setEditNome(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(p.id)}
                          className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#D4AF37]/50 rounded-lg text-sm text-white focus:outline-none"
                          autoFocus
                        />
                        <select
                          value={editTipo}
                          onChange={(e) => setEditTipo(e.target.value as "banco" | "administradora")}
                          className="px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white focus:outline-none"
                        >
                          <option value="banco">Banco</option>
                          <option value="administradora">Administradora</option>
                        </select>
                        <button
                          onClick={() => handleSaveEdit(p.id)}
                          className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-2 rounded-lg bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-sm flex-shrink-0">
                          📋
                        </div>
                        <span className="flex-1 text-sm text-white font-medium">{p.nome}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── WHATSAPP AFILIADO TEMPLATE TAB ─── */}
      {activeTab === "whatsapp_afiliado" && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-[#25D366]/5 to-[#D4AF37]/5 border border-[#25D366]/20 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <MessageCircle size={18} className="text-[#25D366]" />
              Template WhatsApp para Afiliados
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Personalize a mensagem enviada automaticamente ao afiliado quando ele cadastra um lead.
              Use as variáveis abaixo para inserir dados dinâmicos na mensagem.
            </p>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3 text-sm">Variáveis Disponíveis</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                <code className="text-[#D4AF37] text-xs font-mono">{"{nome_afiliado}"}</code>
                <p className="text-[10px] text-[#94A3B8] mt-1">Nome do afiliado indicador</p>
              </div>
              <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                <code className="text-[#8B5CF6] text-xs font-mono">{"{nome_lead}"}</code>
                <p className="text-[10px] text-[#94A3B8] mt-1">Nome do lead cadastrado</p>
              </div>
              <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                <code className="text-[#22C55E] text-xs font-mono">{"{produto}"}</code>
                <p className="text-[10px] text-[#94A3B8] mt-1">Produto de interesse do lead</p>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-4">
            <h4 className="text-white font-semibold text-sm">Editar Mensagem</h4>
            <textarea
              value={whatsappTemplate}
              onChange={(e) => { setWhatsappTemplate(e.target.value); setTemplateSaved(false); }}
              rows={5}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#25D366]/50 resize-none leading-relaxed"
              placeholder="Digite o template da mensagem..."
            />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                onClick={handleResetTemplate}
                className="flex items-center gap-2 px-4 py-2 text-xs text-[#94A3B8] hover:text-white transition-colors"
              >
                <RotateCcw size={12} />
                Restaurar Padrão
              </button>
              <div className="flex items-center gap-3">
                {templateSaved && (
                  <span className="text-xs text-[#22C55E] flex items-center gap-1">
                    <Check size={12} />
                    Salvo!
                  </span>
                )}
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-sm rounded-lg transition-colors"
                >
                  <Save size={14} />
                  Salvar Template
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5 space-y-3">
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              👁️ Pré-visualização
              <span className="text-[10px] text-[#94A3B8] font-normal">(com dados de exemplo)</span>
            </h4>
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4">
              <div className="max-w-md">
                <div className="bg-[#005C4B] rounded-xl rounded-tl-none p-3">
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{templatePreview}</p>
                  <p className="text-[10px] text-[#94A3B8] text-right mt-2">Agora ✓✓</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MENSAGENS TAB ─── */}
      {activeTab === "mensagens" && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <label className="text-sm text-white font-medium mb-3 block">Selecione a Landing Page</label>
            <select
              value={selectedLP}
              onChange={(e) => setSelectedLP(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
            >
              {landingPages.map((lp) => (
                <option key={lp.id} value={lp.id}>{lp.nome} - {lp.dominio}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((msg) => (
                <div key={msg.id} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/15 text-[#D4AF37] capitalize">
                      {msg.tipo === "primeiro_contato" ? "Primeiro Contato" : msg.tipo === "follow_up" ? "Follow Up" : "Simulação"}
                    </span>
                  </div>
                  <textarea
                    defaultValue={msg.mensagem}
                    rows={3}
                    className="w-full px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-[#94A3B8]">Variáveis: {"{nome}"}, {"{valor}"}</p>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-xs rounded-lg transition-colors">
                      <Save size={14} />
                      Salvar
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-8 text-center">
                <MessageSquare size={40} className="mx-auto text-[#1E293B] mb-3" />
                <p className="text-[#94A3B8] text-sm">Nenhuma mensagem configurada para esta landing page</p>
                <button className="mt-4 px-5 py-2 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-sm rounded-lg transition-colors">
                  Criar Mensagem
                </button>
              </div>
            )}
          </div>

          <button className="w-full py-3 border-2 border-dashed border-[#1E293B] rounded-xl text-sm text-[#94A3B8] hover:border-[#D4AF37]/30 hover:text-[#D4AF37] transition-colors">
            + Adicionar nova mensagem automática
          </button>
        </div>
      )}

      {/* ─── WEBHOOKS TAB ─── */}
      {activeTab === "webhooks" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#FDE68A]/5 border border-[#D4AF37]/20 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Link2 size={18} className="text-[#D4AF37]" />
              Integração Universal via Webhook
            </h3>
            <p className="text-sm text-[#94A3B8]">
              Cada landing page possui um webhook único. Cole o link no Facebook Ads, Google Ads ou RD Station
              para receber leads automaticamente.
            </p>
          </div>

          {landingPages.map((lp) => (
            <div key={lp.id} className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lp.cor }} />
                <h4 className="text-white font-medium text-sm">{lp.nome}</h4>
                <span className="text-xs text-[#94A3B8]">({lp.dominio})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-[#D4AF37] font-mono truncate">
                  {lp.webhookUrl}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(lp.webhookUrl)}
                  className="px-4 py-3 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                >
                  Copiar
                </button>
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <span className="px-2 py-1 rounded text-[10px] bg-[#1E293B] text-[#94A3B8]">Facebook Ads</span>
                <span className="px-2 py-1 rounded text-[10px] bg-[#1E293B] text-[#94A3B8]">Google Ads</span>
                <span className="px-2 py-1 rounded text-[10px] bg-[#1E293B] text-[#94A3B8]">RD Station</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── NOTIFICAÇÕES TAB ─── */}
      {activeTab === "notificacoes" && (
        <div className="space-y-5">
          {/* Permission Status Banner */}
          <div className={`rounded-xl p-5 border ${
            notifSettings.pushPermission === "granted"
              ? "bg-gradient-to-r from-[#22C55E]/5 to-[#D4AF37]/5 border-[#22C55E]/20"
              : notifSettings.pushPermission === "denied"
              ? "bg-gradient-to-r from-[#EF4444]/5 to-[#F59E0B]/5 border-[#EF4444]/20"
              : "bg-gradient-to-r from-[#D4AF37]/5 to-[#FDE68A]/5 border-[#D4AF37]/20"
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                notifSettings.pushPermission === "granted"
                  ? "bg-[#22C55E]/10"
                  : notifSettings.pushPermission === "denied"
                  ? "bg-[#EF4444]/10"
                  : "bg-[#D4AF37]/10"
              }`}>
                {notifSettings.pushPermission === "granted" ? (
                  <BellRing size={24} className="text-[#22C55E]" />
                ) : notifSettings.pushPermission === "denied" ? (
                  <Shield size={24} className="text-[#EF4444]" />
                ) : (
                  <Bell size={24} className="text-[#D4AF37]" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                  <Smartphone size={16} className="text-[#94A3B8]" />
                  Notificações Push do Navegador
                </h3>
                {notifSettings.pushPermission === "granted" ? (
                  <p className="text-sm text-[#22C55E]">
                    ✅ Notificações push ativadas! Você será alertado quando novos leads chegarem.
                  </p>
                ) : notifSettings.pushPermission === "denied" ? (
                  <div>
                    <p className="text-sm text-[#EF4444] mb-2">
                      ❌ Notificações bloqueadas pelo navegador.
                    </p>
                    <p className="text-xs text-[#94A3B8]">
                      Para ativar, clique no ícone de cadeado na barra de endereço do navegador → Permissões → Notificações → Permitir.
                    </p>
                  </div>
                ) : notifSettings.pushPermission === "unsupported" ? (
                  <p className="text-sm text-[#94A3B8]">
                    Seu navegador não suporta notificações push.
                  </p>
                ) : (
                  <div>
                    <p className="text-sm text-[#94A3B8] mb-3">
                      Ative as notificações push para receber alertas em tempo real quando novos leads chegarem via webhook do Facebook Ads ou Google Ads.
                    </p>
                    <button
                      onClick={handleRequestPermission}
                      disabled={permissionRequesting}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#C4A030] hover:from-[#E5C040] hover:to-[#D4AF37] text-[#0F172A] font-bold text-sm rounded-xl transition-all duration-200 shadow-[0_0_15px_rgba(212,175,55,0.2)] hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-50"
                    >
                      <BellRing size={16} />
                      {permissionRequesting ? "Solicitando..." : "🔔 Ativar Notificações Push"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Settings */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Bell size={18} className="text-[#D4AF37]" />
              Configurações de Notificação
              {notifSaved && (
                <span className="text-xs text-[#22C55E] flex items-center gap-1 ml-auto">
                  <Check size={12} />
                  Salvo!
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {/* Push Enabled */}
              <div className="flex items-center justify-between p-4 bg-[#0F172A]/50 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium flex items-center gap-2">
                    <BellRing size={14} className="text-[#D4AF37]" />
                    Notificação Push
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Alerta push no navegador/celular para novos leads</p>
                </div>
                <Toggle
                  enabled={notifSettings.pushEnabled}
                  onChange={(v) => updateNotifSetting("pushEnabled", v)}
                  disabled={notifSettings.pushPermission !== "granted"}
                />
              </div>

              {/* Sound Enabled */}
              <div className="flex items-center justify-between p-4 bg-[#0F172A]/50 rounded-lg">
                <div>
                  <p className="text-sm text-white font-medium flex items-center gap-2">
                    {notifSettings.soundEnabled ? (
                      <Volume2 size={14} className="text-[#3B82F6]" />
                    ) : (
                      <VolumeX size={14} className="text-[#94A3B8]" />
                    )}
                    Notificação Sonora
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">Som de alerta junto com a notificação push</p>
                </div>
                <Toggle
                  enabled={notifSettings.soundEnabled}
                  onChange={(v) => updateNotifSetting("soundEnabled", v)}
                />
              </div>

              {/* Test Notification */}
              {notifSettings.pushPermission === "granted" && (
                <button
                  onClick={handleTestNotification}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] font-bold text-sm rounded-xl transition-all border border-[#D4AF37]/20"
                >
                  <BellRing size={16} />
                  Enviar Notificação de Teste
                </button>
              )}
            </div>
          </div>

          {/* Priority Filters */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Filtros de Notificação por Prioridade</h3>
            <p className="text-xs text-[#94A3B8] mb-4">
              Escolha quais prioridades de leads devem disparar notificações push.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-[#0F172A]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <div>
                    <span className="text-sm text-white font-medium">🔥 Alto Padrão</span>
                    <p className="text-[10px] text-[#94A3B8]">Push persistente (requer interação)</p>
                  </div>
                </div>
                <Toggle
                  enabled={notifSettings.filterAlto}
                  onChange={(v) => updateNotifSetting("filterAlto", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F172A]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                  <div>
                    <span className="text-sm text-white font-medium">⚡ Médio</span>
                    <p className="text-[10px] text-[#94A3B8]">Push padrão com som</p>
                  </div>
                </div>
                <Toggle
                  enabled={notifSettings.filterMedio}
                  onChange={(v) => updateNotifSetting("filterMedio", v)}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-[#0F172A]/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#94A3B8]" />
                  <div>
                    <span className="text-sm text-white font-medium">📋 Baixo</span>
                    <p className="text-[10px] text-[#94A3B8]">Push silencioso</p>
                  </div>
                </div>
                <Toggle
                  enabled={notifSettings.filterBaixo}
                  onChange={(v) => updateNotifSetting("filterBaixo", v)}
                />
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-3 text-sm">Como Funciona</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <span className="text-lg">1️⃣</span>
                <div>
                  <p className="text-sm text-white font-medium">Webhook recebe o lead</p>
                  <p className="text-xs text-[#94A3B8]">Facebook Ads ou Google Ads envia dados do lead para o webhook da landing page</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <span className="text-lg">2️⃣</span>
                <div>
                  <p className="text-sm text-white font-medium">Lead é cadastrado no CRM</p>
                  <p className="text-xs text-[#94A3B8]">O sistema processa e armazena o lead automaticamente</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <span className="text-lg">3️⃣</span>
                <div>
                  <p className="text-sm text-white font-medium">Notificação push é disparada</p>
                  <p className="text-xs text-[#94A3B8]">O admin recebe alerta instantâneo com nome, origem e produto do lead</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <span className="text-lg">4️⃣</span>
                <div>
                  <p className="text-sm text-white font-medium">Clique abre o Feed de Leads</p>
                  <p className="text-xs text-[#94A3B8]">Ao clicar na notificação, o CRM abre diretamente na aba de leads</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}