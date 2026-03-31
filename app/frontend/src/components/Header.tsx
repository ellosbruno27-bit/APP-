import { Search } from "lucide-react";
import Notifications from "./Notifications";
import type { Page } from "./Sidebar";

interface HeaderProps {
  currentPage: Page;
  onNavigateToLead?: (leadId: string) => void;
}

const pageTitles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Visão geral do CRM" },
  leads: { title: "Feed de Leads", subtitle: "Gerencie seus leads" },
  "landing-pages": { title: "Landing Pages", subtitle: "Gerencie seus domínios" },
  corretores: { title: "Corretores", subtitle: "Equipe de vendas" },
  historico: { title: "Histórico de Notificações", subtitle: "Registro completo de alertas" },
  perfil: { title: "Meu Perfil", subtitle: "Informações pessoais e preferências" },
  configuracoes: { title: "Configurações", subtitle: "Ajustes do sistema" },
};

export default function Header({ currentPage, onNavigateToLead }: HeaderProps) {
  const pageInfo = pageTitles[currentPage] || pageTitles.dashboard;

  return (
    <header className="flex items-center justify-between mb-4 sm:mb-6 pb-4 border-b border-[#2A2A2A]/50">
      {/* Left: Page info */}
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-white truncate">{pageInfo.title}</h1>
        <p className="text-xs text-[#8A8A8A] hidden sm:block">{pageInfo.subtitle}</p>
      </div>

      {/* Right: Search + Notifications */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Quick Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Buscar leads, corretores..."
            className="w-64 pl-10 pr-4 py-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#D4A853]/40 transition-colors"
          />
        </div>

        {/* Notifications */}
        <Notifications onNavigateToLead={onNavigateToLead} />

        {/* User Avatar - hidden on mobile since it's in the mobile header */}
        <div className="hidden lg:flex w-9 h-9 rounded-xl gold-gradient items-center justify-center text-[#0A0A0A] text-xs font-bold cursor-pointer hover:shadow-[0_0_12px_rgba(212,168,83,0.3)] transition-shadow">
          AD
        </div>
      </div>
    </header>
  );
}