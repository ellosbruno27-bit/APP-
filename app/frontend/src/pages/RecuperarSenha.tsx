import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle, KeyRound } from "lucide-react";

export default function RecuperarSenha() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("contato@maximoconceitoassessoria.com.br");
  const [isLoading, setIsLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Por favor, insira um e-mail válido.");
      return;
    }

    setIsLoading(true);

    // Simulate sending recovery email
    setTimeout(() => {
      setEnviado(true);
      setIsLoading(false);
    }, 1500);
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
            Recuperação de Senha
          </p>
        </div>

        {/* Recovery Card */}
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 shadow-2xl">
          {!enviado ? (
            <>
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center">
                  <KeyRound size={24} className="text-[#D4A853]" />
                </div>
              </div>
              <p className="text-[#B0B0B0] text-sm mb-6 leading-relaxed text-center">
                Informe seu e-mail cadastrado abaixo. Enviaremos um link para
                redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#B0B0B0]">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666]"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#D4A853]/50 focus:ring-1 focus:ring-[#D4A853]/30 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Webmail Link */}
                <div className="text-right">
                  <a
                    href="https://maximoconceitoassessoria.com.br:2096/cpsess1733298747/3rdparty/roundcube/?_task=mail&_mbox=INBOX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#D4A853] hover:text-[#E8C373] transition-colors underline underline-offset-2"
                  >
                    Acessar Webmail
                  </a>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl font-semibold text-[#0A0A0A] bg-gradient-to-r from-[#D4A853] to-[#E8C373] hover:from-[#E8C373] hover:to-[#D4A853] transition-all duration-300 shadow-[0_4px_20px_rgba(212,168,83,0.3)] hover:shadow-[0_4px_30px_rgba(212,168,83,0.5)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
                  ) : (
                    <>
                      Enviar Link de Redefinição
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-[#D4A853]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-3">
                E-mail Enviado!
              </h2>
              <p className="text-[#8A8A8A] text-sm leading-relaxed mb-2">
                Enviamos um link de redefinição de senha para:
              </p>
              <p className="text-[#D4A853] font-medium text-sm mb-6 break-all">
                {email}
              </p>
              <p className="text-[#666] text-xs mb-6">
                Verifique sua caixa de entrada e a pasta de spam. O link expira
                em 24 horas.
              </p>

              {/* Webmail Link */}
              <a
                href="https://maximoconceitoassessoria.com.br:2096/cpsess1733298747/3rdparty/roundcube/?_task=mail&_mbox=INBOX"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0A0A0A] bg-gradient-to-r from-[#D4A853] to-[#E8C373] hover:from-[#E8C373] hover:to-[#D4A853] transition-all duration-300 shadow-[0_4px_20px_rgba(212,168,83,0.3)] hover:shadow-[0_4px_30px_rgba(212,168,83,0.5)] mb-4"
              >
                <Mail size={18} />
                Abrir Webmail
              </a>

              <button
                onClick={() => {
                  setEnviado(false);
                  setEmail("contato@maximoconceitoassessoria.com.br");
                }}
                className="block w-full text-sm text-[#8A8A8A] hover:text-[#D4A853] transition-colors mt-3"
              >
                Não recebeu? Enviar novamente
              </button>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Back to Login */}
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3.5 rounded-xl font-semibold text-[#D4A853] bg-transparent border border-[#D4A853]/30 hover:border-[#D4A853]/60 hover:bg-[#D4A853]/5 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar ao Login
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