import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface ImportedLead {
  nome: string;
  telefone: string;
  email: string;
  valorPretendido: number;
  servico: string;
  origem: string;
  observacao?: string;
}

interface ImportLeadsProps {
  onClose: () => void;
  onImport: (leads: ImportedLead[]) => void;
}

type Step = "upload" | "preview" | "success";

const EXPECTED_COLUMNS = ["nome", "telefone", "email", "valor", "servico", "origem", "observacao"];

export default function ImportLeads({ onClose, onImport }: ImportLeadsProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsedLeads, setParsedLeads] = useState<ImportedLead[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setIsProcessing(true);
    setErrors([]);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: "" });

        if (jsonData.length === 0) {
          setErrors(["A planilha está vazia. Adicione dados e tente novamente."]);
          setIsProcessing(false);
          return;
        }

        const validationErrors: string[] = [];
        const leads: ImportedLead[] = [];

        jsonData.forEach((row, index) => {
          const rowNum = index + 2;
          const keys = Object.keys(row);

          const nome = findColumnValue(row, keys, ["nome", "name", "cliente", "lead"]);
          const telefone = findColumnValue(row, keys, ["telefone", "phone", "celular", "whatsapp", "tel"]);
          const email = findColumnValue(row, keys, ["email", "e-mail", "mail"]);
          const valorStr = findColumnValue(row, keys, ["valor", "value", "valor_pretendido", "montante"]);
          const servico = findColumnValue(row, keys, ["servico", "serviço", "service", "produto", "tipo"]);
          const origem = findColumnValue(row, keys, ["origem", "source", "canal", "fonte"]);
          const observacao = findColumnValue(row, keys, ["observacao", "observação", "obs", "nota", "note"]);

          if (!nome) {
            validationErrors.push(`Linha ${rowNum}: Nome é obrigatório`);
            return;
          }
          if (!telefone) {
            validationErrors.push(`Linha ${rowNum}: Telefone é obrigatório`);
            return;
          }

          const valor = parseFloat(String(valorStr).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

          leads.push({
            nome: String(nome).trim(),
            telefone: formatPhone(String(telefone).trim()),
            email: String(email || "").trim(),
            valorPretendido: valor,
            servico: mapServico(String(servico || "").trim()),
            origem: mapOrigem(String(origem || "").trim()),
            observacao: String(observacao || "").trim(),
          });
        });

        if (validationErrors.length > 5) {
          setErrors([
            ...validationErrors.slice(0, 5),
            `... e mais ${validationErrors.length - 5} erros`,
          ]);
        } else {
          setErrors(validationErrors);
        }

        setParsedLeads(leads);
        if (leads.length > 0) {
          setStep("preview");
        }
      } catch {
        setErrors(["Erro ao processar o arquivo. Verifique se é um arquivo Excel válido (.xlsx ou .xls)."]);
      }
      setIsProcessing(false);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirmImport = () => {
    onImport(parsedLeads);
    setStep("success");
  };

  const removeLead = (index: number) => {
    setParsedLeads((prev) => prev.filter((_, i) => i !== index));
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["nome", "telefone", "email", "valor", "servico", "origem", "observacao"],
      ["João da Silva", "(11) 99999-0000", "joao@email.com", "150000", "home_equity", "google_ads", "Lead quente"],
      ["Maria Santos", "(21) 98888-1111", "maria@email.com", "300000", "financiamento_veiculos", "facebook_ads", "Indicação"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, "modelo_importacao_leads.xlsx");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2A2A] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#D4A853]/10 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-[#D4A853]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Importar Leads</h3>
              <p className="text-xs text-[#8A8A8A]">
                {step === "upload" && "Faça upload de uma planilha Excel"}
                {step === "preview" && `${parsedLeads.length} leads encontrados em ${fileName}`}
                {step === "success" && "Importação concluída!"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#8A8A8A] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step: Upload */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-[#D4A853] bg-[#D4A853]/5"
                    : "border-[#2A2A2A] hover:border-[#D4A853]/30 hover:bg-[#1C1C1C]/30"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={48} className="text-[#D4A853] animate-spin" />
                    <p className="text-white font-medium">Processando arquivo...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#1C1C1C] flex items-center justify-center border border-[#2A2A2A]">
                      <Upload size={28} className="text-[#D4A853]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Arraste e solte seu arquivo Excel aqui
                      </p>
                      <p className="text-sm text-[#8A8A8A] mt-1">
                        ou clique para selecionar • .xlsx, .xls, .csv
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Template Download */}
              <div className="bg-[#0A0A0A]/50 border border-[#2A2A2A] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">📋 Modelo de Planilha</p>
                    <p className="text-xs text-[#8A8A8A] mt-0.5">
                      Baixe o modelo com as colunas corretas para importação
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D4A853]/15 hover:bg-[#D4A853]/25 text-[#D4A853] text-xs font-bold rounded-lg transition-colors"
                  >
                    <Download size={14} />
                    Baixar Modelo
                  </button>
                </div>
              </div>

              {/* Expected Columns */}
              <div className="bg-[#0A0A0A]/50 border border-[#2A2A2A] rounded-xl p-4">
                <p className="text-sm text-white font-medium mb-3">Colunas Esperadas</p>
                <div className="flex flex-wrap gap-2">
                  {EXPECTED_COLUMNS.map((col) => (
                    <span
                      key={col}
                      className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#1C1C1C] text-[#8A8A8A] border border-[#2A2A2A]"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-[#8A8A8A] mt-2">
                  * <strong className="text-white">nome</strong> e <strong className="text-white">telefone</strong> são obrigatórios. As demais colunas são opcionais.
                </p>
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-[#EF4444]" />
                    <p className="text-sm text-[#EF4444] font-medium">Erros encontrados</p>
                  </div>
                  <ul className="space-y-1">
                    {errors.map((err, i) => (
                      <li key={i} className="text-xs text-[#EF4444]/80">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-[#F59E0B]" />
                    <p className="text-sm text-[#F59E0B] font-medium">
                      {errors.length} linha(s) ignorada(s) por erro
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {errors.map((err, i) => (
                      <li key={i} className="text-xs text-[#F59E0B]/80">• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#D4A853]/10 border border-[#D4A853]/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#D4A853]">{parsedLeads.length}</p>
                  <p className="text-xs text-[#8A8A8A]">Leads válidos</p>
                </div>
                <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#3B82F6]">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(
                      parsedLeads.reduce((acc, l) => acc + l.valorPretendido, 0)
                    )}
                  </p>
                  <p className="text-xs text-[#8A8A8A]">Valor total</p>
                </div>
                <div className="bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-[#8B5CF6]">{fileName}</p>
                  <p className="text-xs text-[#8A8A8A]">Arquivo</p>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-[#2A2A2A] rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#0A0A0A] sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">#</th>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">Nome</th>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">Telefone</th>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">E-mail</th>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">Valor</th>
                        <th className="text-left px-4 py-3 text-xs text-[#8A8A8A] font-medium">Serviço</th>
                        <th className="text-center px-4 py-3 text-xs text-[#8A8A8A] font-medium">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2A2A]">
                      {parsedLeads.map((lead, i) => (
                        <tr key={i} className="hover:bg-[#1C1C1C]/30 transition-colors">
                          <td className="px-4 py-3 text-[#8A8A8A] text-xs">{i + 1}</td>
                          <td className="px-4 py-3 text-white font-medium">{lead.nome}</td>
                          <td className="px-4 py-3 text-[#8A8A8A]">{lead.telefone}</td>
                          <td className="px-4 py-3 text-[#8A8A8A]">{lead.email || "—"}</td>
                          <td className="px-4 py-3 text-[#D4A853]">
                            {lead.valorPretendido > 0
                              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(lead.valorPretendido)
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-[#8A8A8A] capitalize">{lead.servico || "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeLead(i)}
                              className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#8A8A8A] hover:text-[#EF4444] transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-[#D4A853]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} className="text-[#D4A853]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Importação Concluída! 🎉</h3>
              <p className="text-[#8A8A8A]">
                <span className="text-[#D4A853] font-bold">{parsedLeads.length} leads</span> foram importados com sucesso
              </p>
              <p className="text-xs text-[#8A8A8A] mt-2">
                Os leads foram adicionados ao feed e estão prontos para atendimento
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#2A2A2A] flex-shrink-0">
          {step === "upload" && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white text-sm font-medium rounded-lg transition-colors border border-[#2A2A2A]"
            >
              Cancelar
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={() => {
                  setStep("upload");
                  setParsedLeads([]);
                  setErrors([]);
                }}
                className="flex-1 px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#2A2A2A] text-white text-sm font-medium rounded-lg transition-colors border border-[#2A2A2A]"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={parsedLeads.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 gold-gradient hover:opacity-90 text-[#0A0A0A] text-sm font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(212,168,83,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importar {parsedLeads.length} Leads
                <ArrowRight size={16} />
              </button>
            </>
          )}
          {step === "success" && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 gold-gradient hover:opacity-90 text-[#0A0A0A] text-sm font-bold rounded-lg transition-colors shadow-[0_0_20px_rgba(212,168,83,0.2)]"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function findColumnValue(row: Record<string, unknown>, keys: string[], possibleNames: string[]): unknown {
  for (const name of possibleNames) {
    const key = keys.find((k) => k.toLowerCase().trim() === name.toLowerCase());
    if (key && row[key] !== undefined && row[key] !== "") return row[key];
  }
  return undefined;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function mapServico(servico: string): string {
  const lower = servico.toLowerCase();
  if (lower.includes("home equity") || lower.includes("homeequity")) return "home_equity";
  if (lower.includes("capital de giro") || lower.includes("capitaldegiro")) return "capital_giro_pj";
  if (lower.includes("veículo") || lower.includes("veiculo") || lower.includes("veiculos")) return "financiamento_veiculos";
  if (lower.includes("caminhão") || lower.includes("caminhao")) return "financiamento_caminhao";
  if (lower.includes("condomínio") || lower.includes("condominio")) return "emprestimo_condominio";
  if (lower.includes("rural") || lower.includes("credito rural")) return "credito_rural";
  return servico || "home_equity";
}

function mapOrigem(origem: string): string {
  const lower = origem.toLowerCase();
  if (lower.includes("google")) return "google_ads";
  if (lower.includes("facebook") || lower.includes("meta") || lower.includes("instagram")) return "facebook_ads";
  if (lower.includes("rd") || lower.includes("station")) return "rd_station";
  return "organico";
}