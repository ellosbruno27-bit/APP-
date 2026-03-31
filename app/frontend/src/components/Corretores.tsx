import { useState } from "react";
import { corretores as allCorretores, landingPages } from "@/lib/data";
import { Users, Plus, X, Phone, Mail, ToggleLeft, ToggleRight, Shuffle } from "lucide-react";

export default function Corretores() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Corretores</h2>
          <p className="text-sm text-[#94A3B8]">Gerencie sua equipe e distribuição Round Robin</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C4A030] text-[#0F172A] font-bold text-sm rounded-lg transition-all duration-200 shadow-[0_0_20px_rgba(212,175,55,0.2)]"
        >
          <Plus size={18} />
          Novo Corretor
        </button>
      </div>

      {/* Round Robin Info */}
      <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#FDE68A]/10 border border-[#D4AF37]/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <Shuffle size={20} className="text-[#D4AF37]" />
          <h3 className="text-white font-semibold">Distribuição Round Robin</h3>
        </div>
        <p className="text-sm text-[#94A3B8]">
          Os leads são distribuídos automaticamente de forma justa entre os corretores ativos.
          Cada landing page pode ter sua própria equipe de corretores.
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            <span className="text-xs text-[#94A3B8]">{allCorretores.filter((c) => c.ativo).length} ativos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
            <span className="text-xs text-[#94A3B8]">{allCorretores.filter((c) => !c.ativo).length} inativos</span>
          </div>
        </div>
      </div>

      {/* Corretores List */}
      <div className="space-y-3">
        {allCorretores.map((c) => {
          const assignedLPs = landingPages.filter((lp) => c.landingPages.includes(lp.id));
          return (
            <div
              key={c.id}
              className={`bg-[#111827] border rounded-xl p-5 transition-all duration-200 ${
                c.ativo ? "border-[#1E293B] hover:border-[#334155]" : "border-[#1E293B]/50 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Avatar & Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-lg font-bold flex-shrink-0">
                    {c.nome.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{c.nome}</h3>
                      {c.ativo ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37]">Ativo</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EF4444]/15 text-[#EF4444]">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <Phone size={12} />
                        {c.telefone}
                      </span>
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                        <Mail size={12} />
                        {c.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">{c.leadsAtribuidos}</p>
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">Leads</p>
                  </div>
                  <button className="text-[#94A3B8] hover:text-white transition-colors">
                    {c.ativo ? (
                      <ToggleRight size={32} className="text-[#D4AF37]" />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                </div>
              </div>

              {/* Assigned Landing Pages */}
              <div className="mt-4 pt-4 border-t border-[#1E293B]">
                <p className="text-xs text-[#94A3B8] mb-2">Landing Pages Atribuídas</p>
                <div className="flex flex-wrap gap-2">
                  {assignedLPs.map((lp) => (
                    <span
                      key={lp.id}
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-[#0F172A]"
                      style={{ backgroundColor: lp.cor }}
                    >
                      {lp.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1E293B]">
              <h3 className="text-lg font-semibold text-white">Novo Corretor</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#94A3B8] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Pedro Almeida"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Telefone</label>
                <input
                  type="text"
                  placeholder="(11) 99999-0000"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">E-mail</label>
                <input
                  type="email"
                  placeholder="corretor@centralbankmaximo.com"
                  className="w-full px-4 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
              <div>
                <label className="text-xs text-[#94A3B8] mb-1.5 block">Landing Pages</label>
                <div className="flex flex-wrap gap-2">
                  {landingPages.map((lp) => (
                    <label
                      key={lp.id}
                      className="flex items-center gap-2 px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg cursor-pointer hover:border-[#D4AF37]/30 transition-colors"
                    >
                      <input type="checkbox" className="accent-[#D4AF37]" />
                      <span className="text-xs text-white">{lp.nome}</span>
                    </label>
                  ))}
                </div>
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
                Adicionar Corretor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}