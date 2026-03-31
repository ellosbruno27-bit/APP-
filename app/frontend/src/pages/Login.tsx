import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowRight, LogIn } from "lucide-react";
import { client } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await client.auth.toLogin();
    } catch {
      setError("Erro ao iniciar autenticação. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#D4A853]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#D4A853]/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4A853]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#D4A853]/20 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-full bg-black border-2 border-[#D4A853]/40 flex items-center justify-center overflow-hidden mb-5 shadow-[0_0_40px_rgba(212,168,83,0.15)]">
            <img
              src="/assets/logo-gold.png"
              alt="CentralBank Logo"
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Central<span className="text-[#D4A853]">Bank</span>
          </h1>
          <p className="text-[#8A8A8A] text-sm mt-1 tracking-wide">
            Acesse sua conta
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
          <div className="space-y-5">
            {/* Info text */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center mx-auto mb-4">
                <LogIn size={24} className="text-[#D4A853]" />
              </div>
              <p className="text-[#B0B0B0] text-sm leading-relaxed">
                Clique no botão abaixo para acessar sua conta de administrador
                com autenticação segura.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-[#0A0A0A] bg-gradient-to-r from-[#D4A853] to-[#E8C373] hover:from-[#E8C373] hover:to-[#D4A853] transition-all duration-300 shadow-[0_4px_20px_rgba(212,168,83,0.3)] hover:shadow-[0_4px_30px_rgba(212,168,83,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
              ) : (
                <>
                  <Mail size={18} />
                  Entrar com E-mail
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 text-[#555] text-xs">
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
              Autenticação segura via Atoms Cloud
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="text-xs text-[#666] uppercase tracking-wider">
              ou
            </span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Affiliate Access */}
          <button
            onClick={() => navigate("/afiliado")}
            className="w-full py-3.5 rounded-xl font-semibold text-[#D4A853] bg-transparent border border-[#D4A853]/30 hover:border-[#D4A853]/60 hover:bg-[#D4A853]/5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            Acesso Afiliado
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-[#555] text-xs mt-8">
          © 2026 CentralBank — Todos os direitos reservados
        </p>
      </div>
    </div>
  );
}