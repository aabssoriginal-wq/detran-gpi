"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  FileText, ArrowLeft, Printer, Download, Loader2, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, 
  Calendar, Info, ShieldCheck, TrendingUp, History, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export default function RelatorioPage() {
  const { usuario } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [expandedPanorama, setExpandedPanorama] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (usuario && (usuario.papel !== "admin_master" && usuario.papel !== "admin_total")) {
      toast.error("Acesso restrito aos perfis Admin Master e Admin Total");
      router.push("/dashboard");
      return;
    }

    const fetchReport = async () => {
      try {
        const reportId = searchParams.get("id");
        const url = reportId 
          ? `/api/report?id=${reportId}` 
          : `/api/report?role=${usuario?.papel}&userName=${encodeURIComponent(usuario?.nome || "")}&dept=${encodeURIComponent(searchParams.get("dept") || usuario?.departamento || "")}`;
          
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Erro ao gerar relatório");
        }
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        toast.error(err.message);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (usuario) fetchReport();
  }, [usuario, router]);

  const toggle = (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center space-y-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-blue-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Gemini Canvas: Gerando Relatório Executivo</h2>
          <p className="text-slate-500 mt-2">Analisando logs, repactuações e progresso dos favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 print:p-0 print:m-0 print:max-w-full">
      {/* Header Ações - Oculto na Impressão */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2 border-blue-200 text-blue-700">
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
            <Download className="h-4 w-4" /> Exportar Dados
          </Button>
        </div>
      </div>

      {/* Papel do Relatório (Simulação de A4/Canvas) */}
      <div className="bg-white dark:bg-slate-950 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-800 p-8 md:p-12 min-h-[1000px] print:shadow-none print:border-none">
        
        {/* Cabeçalho Oficial com Gradiente Marinho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-blue-900 pb-8 mb-10 gap-6 relative">
          <div className="absolute bottom-0 left-0 h-1 w-1/3 bg-blue-600" />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <img 
                src="https://www.detran.sp.gov.br/702a783633529610cd8381ac4f5c7b5b.iix" 
                alt="Logo Detran SP" 
                className="h-16 object-contain"
              />
              <div className="h-12 w-px bg-slate-300 mx-2" />
              <div>
                <h1 className="text-2xl font-black text-blue-900 dark:text-blue-400 tracking-tight uppercase">GPI</h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestão de Projetos e Iniciativas</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge className="bg-blue-900 text-white hover:bg-blue-900 mb-2">RELATÓRIO EXECUTIVO IA</Badge>
            <p className="text-xs font-bold text-slate-600">Data de Emissão: {data?.geradoEm || data?.dataGeracao}</p>
            <p className="text-[10px] text-slate-400 uppercase font-medium">Documento Gerado por {usuario?.nome}</p>
          </div>
        </div>

        {/* Panorama Estratégico Reformulado */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-blue-900" />
            <h3 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest border-b-2 border-blue-100 pb-1">Panorama Estratégico</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {data?.panorama?.map((item: any, i: number) => (
              <div 
                key={i} 
                className={`rounded-lg border-l-4 p-4 shadow-sm transition-all hover:shadow-md ${
                  item.nivel === 'alto' ? 'border-blue-900 bg-blue-50/50' : 
                  item.nivel === 'medio' ? 'border-blue-600 bg-blue-50/30' : 
                  'border-blue-400 bg-slate-50/50'
                }`}
              >
                <button 
                  onClick={() => setExpandedPanorama(prev => ({ ...prev, [i]: !prev[i] }))}
                  className="w-full text-left"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-2">{item.titulo}</h4>
                    {expandedPanorama[i] ? <ChevronUp className="h-3 w-3 text-slate-400" /> : <ChevronDown className="h-3 w-3 text-slate-400" />}
                  </div>
                  <p className={`text-xs text-slate-600 dark:text-slate-400 leading-relaxed ${!expandedPanorama[i] && 'line-clamp-2'}`}>
                    {item.descricao}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lista de Projetos Favoritados */}
        <div className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Detalhamento por Iniciativa
          </h3>

          {data?.detalhes.map((proj: any) => (
            <div key={proj.id} className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden transition-all shadow-sm">
              {/* Header do Card Retrátil */}
              <button 
                onClick={() => toggle(proj.id)}
                className="w-full flex items-center justify-between p-5 bg-blue-900 text-white hover:bg-blue-950 transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
                  <div>
                    <h4 className="font-bold">{proj.nome}</h4>
                    <p className="text-[10px] text-blue-200 font-medium uppercase tracking-tight">{proj.departamento}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden md:block text-right">
                    <p className="text-[9px] text-blue-300 uppercase font-black">Progresso</p>
                    <p className="text-sm font-bold">{proj.progress}%</p>
                  </div>
                  {expanded[proj.id] ? <ChevronUp className="h-5 w-5 text-blue-100" /> : <ChevronDown className="h-5 w-5 text-blue-100" />}
                </div>
              </button>

              {/* Conteúdo Detalhado (Retrátil) */}
              {expanded[proj.id] && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-blue-50/10 dark:bg-slate-950 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid md:grid-cols-3 gap-8">
                    
                    {/* Coluna 1: Análise IA */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black text-blue-800 uppercase flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" /> Análise de Governança (IA)
                        </h5>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify border-l-2 border-blue-100 pl-4">
                          {proj.analiseIA}
                        </p>
                        <div className="bg-blue-900 text-white p-4 rounded-lg shadow-inner">
                          <p className="text-[10px] font-black text-blue-200 uppercase mb-1 tracking-widest">Recomendação Estratégica</p>
                          <p className="text-xs font-medium">{proj.conclusao}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black text-slate-500 uppercase flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Marcos de Cronograma
                        </h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Início Baseline</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{proj.baselineData?.inicio || 'N/D'}</p>
                          </div>
                          <div className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Término Baseline</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{proj.baselineData?.fim || 'N/D'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Coluna 2: Eventos Críticos */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h5 className="text-[10px] font-black text-blue-400 uppercase flex items-center gap-2">
                          <History className="h-3.5 w-3.5" /> Histórico Crítico
                        </h5>
                        <div className="space-y-3">
                          {proj.eventosCriticos.map((evento: string, i: number) => (
                            <div key={i} className="flex gap-3">
                              <div className="h-2 w-2 rounded-full bg-blue-900 mt-1.5 shrink-0" />
                              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">{evento}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-[11px] font-black text-slate-400 uppercase">Saúde Atual</h5>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400">Progresso Geral</span>
                          <span className="text-[10px] font-bold text-blue-900">{proj.progress}%</span>
                        </div>
                        <Progress value={proj.progress} className="h-1.5" indicatorColor="bg-blue-900" />
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Rodapé do Relatório - Exportação Externa */}
        <div className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800">
          
          <div className="flex flex-col items-center gap-4 mb-10 print:hidden">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3 w-3" />
              Sincronização Canvas Habilitada
            </div>
            
            <button 
              onClick={() => {
                const textToCopy = `Aja como um renderizador de Gemini Canvas. Crie uma apresentação executiva IDÊNTICA ao código abaixo, utilizando tons de Azul Marinho, Azul Royal e Slate. Mantenha o estilo institucional do DETRAN-SP com cards retráteis para os projetos.\n\nCONTEÚDO DO RELATÓRIO:\n- DATA: ${data?.geradoEm}\n- PANORAMA: ${JSON.stringify(data?.panorama)}\n- PROJETOS: ${JSON.stringify(data?.detalhes)}\n\nESTILO: Executive Blue, Impessoal, Logotipo DETRAN SP no topo, Cards Accordion.`;
                navigator.clipboard.writeText(textToCopy);
                toast.success("Código da apresentação copiado!");
                window.open("https://gemini.google.com/canvas?utm_source=sem&utm_medium=paid-media&utm_campaign=canvas_bkws&gclsrc=aw.ds&gad_source=1&gad_campaignid=22919275109&gbraid=0AAAAApk5BhnNf0WjHfOZOdL-95vtPkepy&gclid=Cj0KCQjw2MbPBhCSARIsAP3jP9wxCWAk68MwagpGWq8BNkmB91lHTfuaSGI_DKpCdbRPayyj5lrlMUsaArDxEALw_wcB", "_blank");
              }}
              className="flex items-center gap-2 px-5 py-2 border border-blue-200 text-blue-900 rounded-lg text-[10px] font-black uppercase tracking-tighter hover:bg-blue-50 transition-all"
            >
              <ExternalLink className="h-3 w-3" />
              Preparar Edição Externa (Gemini)
            </button>
            
            <p className="text-[9px] text-slate-400 text-center italic max-w-xs leading-tight">
              Instrução: Clique acima para copiar os dados e abrir o portal externo. No Gemini, use "CTRL+V" para carregar a apresentação idêntica.
            </p>
          </div>

          <div className="text-center">
            <p className="text-[10px] text-blue-900 dark:text-blue-400 uppercase font-black tracking-[0.3em] mb-4">
              Departamento Estadual de Trânsito de São Paulo - DETRAN SP
            </p>
            <div className="flex justify-center gap-8 text-[9px] text-slate-400">
              <span>© 2026 GPI v2.5.1</span>
              <span>Inteligência Artificial por Google Gemini 2.5 Flash</span>
              <span className="print:inline hidden">Autenticação: {Math.random().toString(36).substring(7).toUpperCase()}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
