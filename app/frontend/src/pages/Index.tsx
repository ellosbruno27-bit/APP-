import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import LeadFeed from "@/components/LeadFeed";
import FilaAtendimento from "@/components/FilaAtendimento";
import Produtos from "@/components/Produtos";
import LandingPages from "@/components/LandingPages";
import Corretores from "@/components/Corretores";
import Afiliados from "@/components/Afiliados";
import Treinamento from "@/components/Treinamento";
import Configuracoes from "@/components/Configuracoes";
import { BackendDataProvider } from "@/lib/BackendDataContext";
import { requestNotificationPermission, loadNotificationSettings, saveNotificationSettings } from "@/lib/notifications";
import type { Page } from "@/components/Sidebar";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  // Auto-request notification permission on first visit (soft prompt)
  useEffect(() => {
    const settings = loadNotificationSettings();
    if (settings.pushPermission === "default" && "Notification" in window) {
      // Auto-request after a short delay so the user sees the dashboard first
      const timer = setTimeout(async () => {
        const permission = await requestNotificationPermission();
        const updated = { ...settings, pushPermission: permission, pushEnabled: permission === "granted" };
        saveNotificationSettings(updated);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for service worker notification click messages
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIFICATION_CLICK") {
        setCurrentPage("leads");
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "leads":
        return <LeadFeed />;
      case "fila":
        return <FilaAtendimento />;
      case "produtos":
        return <Produtos />;
      case "landing-pages":
        return <LandingPages />;
      case "corretores":
        return <Corretores />;
      case "afiliados":
        return <Afiliados />;
      case "treinamento":
        return <Treinamento />;
      case "configuracoes":
        return <Configuracoes />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <BackendDataProvider>
      <div className="min-h-screen bg-[#0F172A]">
        <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        {/* Main content: on mobile add top padding for the mobile header bar, no left margin */}
        <main className="pt-16 lg:pt-0 lg:ml-64 p-4 lg:p-6 min-h-screen">
          {renderPage()}
        </main>
      </div>
    </BackendDataProvider>
  );
}