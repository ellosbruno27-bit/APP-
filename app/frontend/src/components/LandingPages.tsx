import { useState } from "react";
import { landingPages as allLandingPages, leads, formatCurrency, productTypes, leadOrigins } from "@/lib/data";
import type { LandingPage } from "@/lib/data";
import {
  Globe,
  Plus,
  Copy,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Users,
  Link2,
  X,
} from "lucide-react";

const LP_PREVIEW = "https://mgx-backend-cdn.metadl.com/generate/images/1058378/2026-03-25/51b9057e-01ef-4d70-aa80-a0f3a1c8f5e0.png";

export default function LandingPages() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLP, setSelectedLP] = useState<LandingPage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyWebhook = (lp: LandingPage) => {
    navigator.clipboard.writeText(lp.webhookUrl);
    setCopiedId(lp.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLPLeads = (lpId: string) => leads.filter((l) => l.landingPageId === lpId);
  const getLPValue = (lpId: string) => getLPLeads(lpId).reduce((acc, l) => acc + l.valorPretendido, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Landing Pages</h2>
          <p className="text-sm text-[#94A3B8]">Gerencie suas landing pages multi-domínio</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-sm rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
        >
          <Plus size={18} />
          Nova Landing Page
        </button>
      </div>

      {/* LP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {allLandingPages.map((lp) => {
          const lpValue = getLPValue(lp.id);
          const taxa = lp.leadsTotal > 0 ? ((lp.conversoes / lp.leadsTotal) * 100).toFixed(1) : "0";

          return (
            <div
              key={lp.id}
              className="bg-[#111827] border border-[#1E293B] rounded-xl overflow-hidden hover:border-[#334155] transition-all duration-300"
            >
              {/* LP Header */}
              <div className="p-5 border-b border-[#1E293B]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${lp.cor}15` }}
                    >
                      <Globe size={22} style={{ color: lp.cor }} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{lp.nome}</h3>
                      <p className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <Link2 size={10} />
                        {lp.dominio}
                      </p>
                    </div>
                  </div>
                  <button className="text-[#94A3B8] hover:text-white">
                    {lp.ativa ? (
                      <ToggleRight size={28} className="text-[#D4AF37]" />
                    ) : (
                      <ToggleLeft size={28} className="text-[#94A3B8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-[#1E293B]">
                <div className="p-4 text-center">
                  <p className="text-lg font-bold text-white">{lp.leadsTotal}</p>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Leads</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-lg font-bold" style={{ color: lp.cor }}>{taxa}%</p>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Conversão</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-lg font-bold text-[#D4AF37]">{lp.conversoes}</p>
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Fechados</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-3 border-t border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Proprietário</span>
                  <span className="text-xs text-white font-medium">{lp.proprietario}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94A3B8]">Valor Total</span>
                  <span className="text-xs text-[#D4AF37] font-medium">{formatCurrency(lpValue)}</span>
                </div>

                {/* Webhook */}
                <div className="mt-3">
                  <p className="text-xs text-[#94A3B8] mb-1.5">Webhook URL</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-[#94A3B8] truncate font-mono">
                      {lp.webhookUrl}
                    </div>
                    <button
                      onClick={() => copyWebhook(lp)}
                      className="flex-shrink-0 p-2 bg-[#0F172A] border border-[#1E293B] rounded-lg hover:border-[#D4AF37]/50 transition-colors"
                    >
                      <Copy size={14} className={copiedId === lp.id ? "text-[#D4AF37]" : "text-[#94A3B8]"} />
                    </button>
                  </div>
                  {copiedId === lp.id && (
                    <p className="text-[10px] text-[#D4AF37] mt-1">✓ Copiado!</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedLP(lp)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Users size={14} />
                    Detalhes
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium rounded-lg transition-colors">
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal - with new fields: Nome, CPF/CNPJ, Tipo do Produto, Valor, Origem */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
              <h3 className="text-lg font-semibold text-white">Nova Landing Page</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#94A3B8] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Nome da Landing Page</label>
                <input
                  type="text"
                  placeholder="Ex: Crédito Consignado SP"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Domínio</label>
                <input
                  type="text"
                  placeholder="Ex: creditoconsignado-sp.com.br"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Proprietário</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              {/* Divider - Campos de Captura */}
              <div className="pt-2 pb-1">
                <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">Campos de Captura do Lead</p>
                <p className="text-[10px] text-[#94A3B8] mt-1">Campos que serão exibidos no formulário da landing page</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block">Nome do Lead</label>
                  <input
                    type="text"
                    placeholder="Nome completo"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#94A3B8] mb-1.5 block">CPF / CNPJ</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Tipo do Produto</label>
                <select className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                  <option value="">Selecione o tipo de produto...</option>
                  {productTypes.map((pt) => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Valor do Produto</label>
                <input
                  type="text"
                  placeholder="R$ 0,00"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Origem da Lead</label>
                <select className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                  <option value="">Selecione a origem...</option>
                  {leadOrigins.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Mensagem de Primeiro Contato</label>
                <textarea
                  rows={3}
                  placeholder="Olá {nome}, vi que você simulou um crédito de R$ {valor}..."
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50 resize-none"
                />
                <p className="text-[10px] text-[#94A3B8] mt-1">Use {"{nome}"} e {"{valor}"} como variáveis</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#1E293B]">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] text-sm font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
              >
                Criar Landing Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLP && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedLP.cor}15` }}>
                  <Globe size={20} style={{ color: selectedLP.cor }} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedLP.nome}</h3>
                  <p className="text-xs text-[#94A3B8]">{selectedLP.dominio}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLP(null)} className="text-[#94A3B8] hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Preview */}
              <div className="rounded-xl overflow-hidden border border-[#1E293B]">
                <img src={LP_PREVIEW} alt="Landing Page Preview" className="w-full h-48 object-cover" />
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Proprietário</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedLP.proprietario}</p>
                </div>
                <div className="p-4 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Status</p>
                  <p className={`text-sm font-medium mt-1 ${selectedLP.ativa ? "text-[#D4AF37]" : "text-[#EF4444]"}`}>
                    {selectedLP.ativa ? "✓ Ativa" : "✗ Inativa"}
                  </p>
                </div>
                <div className="p-4 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Total de Leads</p>
                  <p className="text-sm text-white font-medium mt-1">{selectedLP.leadsTotal}</p>
                </div>
                <div className="p-4 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Conversões</p>
                  <p className="text-sm font-medium mt-1" style={{ color: selectedLP.cor }}>{selectedLP.conversoes}</p>
                </div>
              </div>

              {/* Captured Fields Info */}
              <div>
                <p className="text-sm text-white font-medium mb-2">Campos de Captura</p>
                <div className="flex flex-wrap gap-2">
                  {["Nome", "CPF/CNPJ", "Tipo do Produto", "Valor do Produto", "Origem da Lead"].map((field) => (
                    <span key={field} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                      {field}
                    </span>
                  ))}
                </div>
              </div>

              {/* Webhook */}
              <div>
                <p className="text-sm text-white font-medium mb-2">Webhook Universal</p>
                <p className="text-xs text-[#94A3B8] mb-2">Cole este link no Facebook Ads, Google Ads ou RD Station</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-[#D4AF37] font-mono">
                    {selectedLP.webhookUrl}
                  </div>
                  <button
                    onClick={() => copyWebhook(selectedLP)}
                    className="px-4 py-3 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-xs rounded-lg transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Template Message */}
              <div>
                <p className="text-sm text-white font-medium mb-2">Mensagem de Primeiro Contato</p>
                <div className="px-4 py-3 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-[#94A3B8]">
                  {selectedLP.templateMensagem}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#1E293B]">
              <button
                onClick={() => setSelectedLP(null)}
                className="w-full px-4 py-2.5 bg-[#1E293B] hover:bg-[#334155] text-white text-sm font-medium rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}