import { useState } from "react";
import {
  formatCurrency,
  formatDate,
  statusLabels,
  origemLabels,
  servicoLabels,
  prioridadeLabels,
  getStatusColor,
  getScoreColor,
  getPrioridadeColor,
  getLandingPageById,
  getCorretorById,
  getWhatsAppLink,
  corretores,
} from "@/lib/data";
import type { Lead, LeadStatus } from "@/lib/data";
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  Globe,
  TrendingUp,
  User,
  Clock,
  Shield,
  ChevronDown,
  FileText,
} from "lucide-react";

interface LeadDetailProps {
  lead: Lead;
  onBack: () => void;
}

export default function LeadDetail({ lead, onBack }: LeadDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const lp = getLandingPageById(lead.landingPageId);
  const corretor = lead.corretorId ? getCorretorById(lead.corretorId) : null;
  const whatsappLink = getWhatsAppLink(lead);

  const statusOptions: LeadStatus[] = ["novo", "em_contato", "simulacao_enviada", "conversao"];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#94A3B8] hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Voltar ao Feed
      </button>

      {/* Header Card */}
      <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-xl font-bold">
              {lead.nome.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{lead.nome}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${getPrioridadeColor(lead.prioridade)}15`,
                    color: getPrioridadeColor(lead.prioridade),
                  }}
                >
                  {prioridadeLabels[lead.prioridade]}
                </span>
                {lp && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold text-[#0F172A]"
                    style={{ backgroundColor: lp.cor }}
                  >
                    {lp.nome}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp CTA */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-[0_0_30px_rgba(37,211,102,0.3)] hover:shadow-[0_0_40px_rgba(37,211,102,0.5)] hover:scale-[1.02] active:scale-[0.98]"
          >
            <MessageCircle size={24} />
            Iniciar Atendimento
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Phone size={18} className="text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-[#94A3B8]">Telefone/WhatsApp</p>
                  <p className="text-sm text-white font-medium">{lead.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Mail size={18} className="text-[#3B82F6]" />
                <div>
                  <p className="text-xs text-[#94A3B8]">E-mail</p>
                  <p className="text-sm text-white font-medium">{lead.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <FileText size={18} className="text-[#D4AF37]" />
                <div>
                  <p className="text-xs text-[#94A3B8]">CPF/CNPJ</p>
                  <p className="text-sm text-white font-medium">{lead.cpfCnpj || "Não informado"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Globe size={18} className="text-[#F59E0B]" />
                <div>
                  <p className="text-xs text-[#94A3B8]">Origem</p>
                  <p className="text-sm text-white font-medium">{origemLabels[lead.origem]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <Clock size={18} className="text-[#8B5CF6]" />
                <div>
                  <p className="text-xs text-[#94A3B8]">Capturado em</p>
                  <p className="text-sm text-white font-medium">{formatDate(lead.criadoEm)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Info */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Dados Financeiros</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0F172A]/50 rounded-lg text-center">
                <p className="text-xs text-[#94A3B8] mb-1">Valor Pretendido</p>
                <p className="text-xl font-bold text-[#D4AF37]">{formatCurrency(lead.valorPretendido)}</p>
              </div>
              <div className="p-4 bg-[#0F172A]/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Shield size={14} className="text-[#94A3B8]" />
                  <p className="text-xs text-[#94A3B8]">Score Estimado</p>
                </div>
                <p className="text-xl font-bold" style={{ color: getScoreColor(lead.scoreEstimado) }}>
                  {lead.scoreEstimado}
                </p>
              </div>
              <div className="p-4 bg-[#0F172A]/50 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-[#94A3B8]" />
                  <p className="text-xs text-[#94A3B8]">Parcela/Renda</p>
                </div>
                <p className={`text-xl font-bold ${lead.relacaoParcelaRenda <= 0.3 ? "text-[#D4AF37]" : "text-[#F59E0B]"}`}>
                  {(lead.relacaoParcelaRenda * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-[#0F172A]/50">
              <p className="text-xs text-[#94A3B8]">Serviço de Interesse</p>
              <p className="text-sm text-white font-medium mt-1">{servicoLabels[lead.servico]}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Histórico de Interações</h3>
            <div className="space-y-4">
              {lead.historico.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                    {i < lead.historico.length - 1 && <div className="w-px flex-1 bg-[#1E293B] mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm text-white">{h.acao}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{formatDate(h.data)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Status do Funil</h3>
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors"
                style={{
                  borderColor: getStatusColor(currentStatus),
                  backgroundColor: `${getStatusColor(currentStatus)}10`,
                }}
              >
                <span className="font-semibold" style={{ color: getStatusColor(currentStatus) }}>
                  {statusLabels[currentStatus]}
                </span>
                <ChevronDown size={16} style={{ color: getStatusColor(currentStatus) }} />
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-lg overflow-hidden z-10 shadow-xl">
                  {statusOptions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setCurrentStatus(s);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-[#111827] transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(s) }} />
                      <span style={{ color: currentStatus === s ? getStatusColor(s) : "#94A3B8" }}>
                        {statusLabels[s]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Funnel Progress */}
            <div className="mt-6 space-y-2">
              {statusOptions.map((s, i) => {
                const isCompleted = statusOptions.indexOf(currentStatus) >= i;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: isCompleted ? getStatusColor(s) : "#1E293B",
                        color: isCompleted ? "#0F172A" : "#94A3B8",
                      }}
                    >
                      {i + 1}
                    </div>
                    <span className={`text-xs ${isCompleted ? "text-white" : "text-[#94A3B8]"}`}>
                      {statusLabels[s]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Corretor */}
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-[#D4AF37]" />
              Corretor Responsável
            </h3>
            {corretor ? (
              <div className="flex items-center gap-3 p-3 bg-[#0F172A]/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-sm font-bold">
                  {corretor.nome.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm text-white font-medium">{corretor.nome}</p>
                  <p className="text-xs text-[#94A3B8]">{corretor.telefone}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[#F59E0B]">⚠️ Sem corretor atribuído</p>
                <select className="w-full px-3 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-[#D4AF37]/50">
                  <option value="">Atribuir corretor...</option>
                  {corretores.filter((c) => c.ativo).map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Landing Page Info */}
          {lp && (
            <div className="bg-[#111827] border border-[#1E293B] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Globe size={18} style={{ color: lp.cor }} />
                Landing Page
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Nome</p>
                  <p className="text-sm text-white font-medium">{lp.nome}</p>
                </div>
                <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Domínio</p>
                  <p className="text-sm font-medium" style={{ color: lp.cor }}>{lp.dominio}</p>
                </div>
                <div className="p-3 bg-[#0F172A]/50 rounded-lg">
                  <p className="text-xs text-[#94A3B8]">Proprietário</p>
                  <p className="text-sm text-white font-medium">{lp.proprietario}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}