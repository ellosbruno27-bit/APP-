import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Globe, Settings, Zap, MessageSquare, Menu, X, ListOrdered, Package, Handshake, ExternalLink, GraduationCap } from "lucide-react";
import NotificationBell from "./NotificationBell";

export type Page = "dashboard" | "leads" | "fila" | "produtos" | "landing-pages" | "corretores" | "afiliados" | "treinamento" | "configuracoes";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const menuItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
  { id: "leads", label: "Feed de Leads", icon: <MessageSquare size={20} /> },
  { id: "fila", label: "Fila de Atendimento", icon: <ListOrdered size={20} /> },
  { id: "produtos", label: "Produtos", icon: <Package size={20} /> },
  { id: "landing-pages", label: "Landing Pages", icon: <Globe size={20} /> },
  { id: "corretores", label: "Corretores", icon: <Users size={20} /> },
  { id: "afiliados", label: "Afiliados", icon: <Handshake size={20} /> },
  { id: "treinamento", label: "Máximo Conceito", icon: <GraduationCap size={20} /> },
  { id: "configuracoes", label: "Configurações", icon: <Settings size={20} /> },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [currentPage]);

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleNavigate = (page: Page) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center flex-shrink-0">
            <Zap size={22} className="text-[#0F172A]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">CentralBankMaximo</h1>
            <p className="text-[10px] text-[#94A3B8] uppercase tracking-widest">CRM Bancário</p>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden text-[#94A3B8] hover:text-white p-1"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                  : "text-[#64748B] hover:bg-[#111827] hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Portal do Afiliado Link */}
      <div className="px-3 pb-2">
        <a
          href="/afiliado"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium text-[#8B5CF6] bg-[#8B5CF6]/5 hover:bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 hover:border-[#8B5CF6]/40 transition-all duration-200"
        >
          <ExternalLink size={14} />
          Portal do Afiliado
          <span className="ml-auto text-[10px] text-[#94A3B8]">↗</span>
        </a>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center text-[#0F172A] text-xs font-bold flex-shrink-0">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">Admin</p>
            <p className="text-[10px] text-[#94A3B8] truncate">admin@centralbankmaximo.com</p>
          </div>
          <div className="hidden lg:block">
            <NotificationBell onNavigateToLeads={() => handleNavigate("leads")} />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F172A] border-b border-[#1E293B] flex items-center px-4 z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#D4AF37] hover:text-[#FDE68A] p-2 -ml-2"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2 ml-3 flex-1">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#D4AF37] to-[#FDE68A] flex items-center justify-center">
            <Zap size={14} className="text-[#0F172A]" />
          </div>
          <span className="text-white font-bold text-sm">CentralBankMaximo</span>
        </div>
        <NotificationBell onNavigateToLeads={() => onNavigate("leads")} />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: slide-in drawer */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0F172A] border-r border-[#1E293B] flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}