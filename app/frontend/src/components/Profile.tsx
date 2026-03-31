import { useState, useEffect, useRef } from "react";
import { client } from "@/lib/api";
import { Camera, Save, Loader2, User, Phone, Bell, Mail, MessageCircle, Smartphone } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  id?: number;
  display_name: string;
  phone: string;
  avatar_url: string;
  notify_email: boolean;
  notify_sms: boolean;
  notify_whatsapp: boolean;
  notify_push: boolean;
}

const BUCKET_NAME = "avatars";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    phone: "",
    avatar_url: "",
    notify_email: true,
    notify_sms: false,
    notify_whatsapp: true,
    notify_push: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Get current user info
      const user = await client.auth.me();
      if (user?.data?.email) {
        setUserEmail(user.data.email);
      }

      // Try to get existing profile
      const response = await client.entities.user_profiles.query({
        query: {},
        limit: 1,
      });

      if (response?.data?.items && response.data.items.length > 0) {
        const existing = response.data.items[0];
        setProfile({
          id: existing.id,
          display_name: existing.display_name || "",
          phone: existing.phone || "",
          avatar_url: existing.avatar_url || "",
          notify_email: existing.notify_email ?? true,
          notify_sms: existing.notify_sms ?? false,
          notify_whatsapp: existing.notify_whatsapp ?? true,
          notify_push: existing.notify_push ?? false,
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const ext = file.name.split(".").pop() || "jpg";
      const objectKey = `avatar_${timestamp}.${ext}`;

      // Upload using web-sdk
      const uploadResp = await client.storage.upload({
        bucket_name: BUCKET_NAME,
        object_key: objectKey,
        file: file,
      });

      if (uploadResp) {
        // Get download URL for preview
        const downloadResp = await client.storage.getDownloadUrl({
          bucket_name: BUCKET_NAME,
          object_key: objectKey,
        });

        const avatarUrl = downloadResp?.data?.download_url || objectKey;
        setProfile((prev) => ({ ...prev, avatar_url: objectKey }));

        // Show preview immediately
        if (downloadResp?.data?.download_url) {
          setAvatarPreview(downloadResp.data.download_url);
        }

        toast.success("Foto atualizada com sucesso!");
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      toast.error("Erro ao enviar a foto. Tente novamente.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const [avatarPreview, setAvatarPreview] = useState("");

  // Load avatar preview URL when profile loads
  useEffect(() => {
    if (profile.avatar_url && !profile.avatar_url.startsWith("http")) {
      client.storage
        .getDownloadUrl({
          bucket_name: BUCKET_NAME,
          object_key: profile.avatar_url,
        })
        .then((resp) => {
          if (resp?.data?.download_url) {
            setAvatarPreview(resp.data.download_url);
          }
        })
        .catch(() => {});
    } else if (profile.avatar_url) {
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile.avatar_url]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        display_name: profile.display_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        notify_email: profile.notify_email,
        notify_sms: profile.notify_sms,
        notify_whatsapp: profile.notify_whatsapp,
        notify_push: profile.notify_push,
      };

      if (profile.id) {
        // Update existing profile
        await client.entities.user_profiles.update({
          id: String(profile.id),
          data,
        });
      } else {
        // Create new profile
        const response = await client.entities.user_profiles.create({ data });
        if (response?.data?.id) {
          setProfile((prev) => ({ ...prev, id: response.data.id }));
        }
      }

      toast.success("Perfil salvo com sucesso!");
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key: keyof ProfileData) => {
    setProfile((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[#D4A853]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
        <p className="text-sm text-[#8A8A8A] mt-1">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Avatar Section */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#D4A853] uppercase tracking-wider mb-4">
          Foto de Perfil
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D4A853]/30 bg-[#1A1A1A] flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={40} className="text-[#8A8A8A]" />
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer"
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <Camera size={24} className="text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm text-white font-medium">
              {profile.display_name || "Usuário"}
            </p>
            <p className="text-xs text-[#8A8A8A] mt-0.5">{userEmail}</p>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="mt-2 text-xs text-[#D4A853] hover:text-[#E8C06A] transition-colors"
            >
              {uploading ? "Enviando..." : "Alterar foto"}
            </button>
          </div>
        </div>
      </div>

      {/* Personal Info Section */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#D4A853] uppercase tracking-wider mb-4">
          Informações Pessoais
        </h3>
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#8A8A8A] mb-1.5">
              <User size={14} />
              Nome de Exibição
            </label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, display_name: e.target.value }))
              }
              placeholder="Seu nome completo"
              className="w-full px-4 py-2.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#D4A853]/40 transition-colors"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#8A8A8A] mb-1.5">
              <Mail size={14} />
              E-mail
            </label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="w-full px-4 py-2.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-sm text-[#8A8A8A] cursor-not-allowed"
            />
            <p className="text-[10px] text-[#666] mt-1">
              O e-mail é gerenciado pelo Atoms Cloud e não pode ser alterado aqui.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm text-[#8A8A8A] mb-1.5">
              <Phone size={14} />
              Telefone
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) =>
                setProfile((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="(11) 99999-9999"
              className="w-full px-4 py-2.5 bg-[#141414] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#D4A853]/40 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[#D4A853] uppercase tracking-wider mb-4">
          <Bell size={14} className="inline mr-1.5 -mt-0.5" />
          Preferências de Notificação
        </h3>
        <div className="space-y-3">
          {/* Email Notifications */}
          <NotificationToggle
            icon={<Mail size={18} />}
            label="Notificações por E-mail"
            description="Receba atualizações de leads e relatórios por e-mail"
            enabled={profile.notify_email}
            onToggle={() => toggleNotification("notify_email")}
          />

          {/* SMS Notifications */}
          <NotificationToggle
            icon={<Smartphone size={18} />}
            label="Notificações por SMS"
            description="Receba alertas urgentes via mensagem de texto"
            enabled={profile.notify_sms}
            onToggle={() => toggleNotification("notify_sms")}
          />

          {/* WhatsApp Notifications */}
          <NotificationToggle
            icon={<MessageCircle size={18} />}
            label="Notificações por WhatsApp"
            description="Receba notificações diretamente no WhatsApp"
            enabled={profile.notify_whatsapp}
            onToggle={() => toggleNotification("notify_whatsapp")}
          />

          {/* Push Notifications */}
          <NotificationToggle
            icon={<Bell size={18} />}
            label="Notificações Push"
            description="Receba notificações no navegador em tempo real"
            enabled={profile.notify_push}
            onToggle={() => toggleNotification("notify_push")}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#D4A853] hover:bg-[#E8C06A] text-[#0A0A0A] font-semibold text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,168,83,0.2)] hover:shadow-[0_0_30px_rgba(212,168,83,0.3)]"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}

// Notification Toggle Component
function NotificationToggle({
  icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-[#141414] border border-[#2A2A2A]/50 hover:border-[#2A2A2A] transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-[#8A8A8A]">{icon}</div>
        <div>
          <p className="text-sm text-white font-medium">{label}</p>
          <p className="text-[11px] text-[#666]">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
          enabled ? "bg-[#D4A853]" : "bg-[#2A2A2A]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}